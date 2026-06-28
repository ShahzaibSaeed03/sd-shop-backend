const qs = require('qs');
const axios = require('axios');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const Category = require('../categorey/category.model');
const { slugify } = require('../../utils/slugify');

const axiosRetry = require('axios-retry').default;

const FIXED_PRODUCTS =
  require('../../config/supplier-games');

const FIXED_CATEGORIES =
  require('../../config/supplier-categories');

// 🔹 CONFIG
const BASE_URL = process.env.SUPPLIER_BASE_URL || 'https://www.lapakgaming.com';
const API_KEY = process.env.SUPPLIER_API_KEY;

// 🔹 EXTRACT BASE CODE (strip provider/region suffix)
// e.g. 'ZZZ300-S116-br' -> 'ZZZ300' | 'AB1580_110' -> 'AB1580_110' (no -S suffix, untouched)
const getBaseCode = (code) => code.split(/-S\d/)[0];

// 🔹 FUZZY MATCH HELPERS — used when the exact configured supplierId code
// no longer exists on the supplier's side (they renamed/restructured it).
// Instead of failing, we look for the closest equivalent within the same
// product "family" and auto-adopt it.

// Letters-only prefix, e.g. 'HSTRLOG60' -> 'HSTRLOG', 'VVAL400BR' -> 'VVAL'
const letterPrefix = (code) => (code.match(/^[A-Za-z]+/) || [''])[0];

// 3-char family key groups codes from the same game even if the supplier
// changes the exact prefix (HSTR -> HSTRLOG both give family 'HST')
const familyKey = (code) => letterPrefix(code).slice(0, 3).toUpperCase();

// First number found in a product name, e.g. "300 + 30 Crystals" -> 300
const extractNumber = (name) => {
  const m = (name || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

// Count shared significant words between two names (for non-numeric
// products like "Express Supply Pass", "Monthly Pass", etc.)
const STOPWORDS = new Set(['the', 'and', 'of', 'a', 'pack', 'for']);
const wordOverlapScore = (a, b) => {
  const wordsOf = (s) =>
    (s || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w));
  const setA = new Set(wordsOf(a));
  const setB = wordsOf(b);
  return setB.filter(w => setA.has(w)).length;
};

// Given a FIXED_PRODUCTS entry and the full supplier product list, find the
// closest equivalent when the exact code no longer exists. Returns an array
// of candidate products (same shape as exact-match results) or [].
const findFuzzyCandidates = (fp, products) => {
  const baseCode = getBaseCode(fp.supplierId);
  const family = familyKey(baseCode);

  const candidatePool = products.filter(p =>
    p.price > 0 &&
    p.status !== 'empty' &&
    familyKey(getBaseCode(p.code)) === family
  );

  if (candidatePool.length === 0) return [];

  const targetNum = extractNumber(fp.name);

  if (targetNum !== null) {
    const numbered = candidatePool
      .map(p => ({ p, num: extractNumber(p.name) }))
      .filter(x => x.num !== null);

    if (numbered.length === 0) return [];

    const exact = numbered.filter(x => x.num === targetNum);
    if (exact.length > 0) return exact.map(x => x.p);

    // no exact amount — accept the closest one, but only within 50%
    // tolerance, so we don't silently substitute a wildly different pack
    numbered.sort((a, b) => Math.abs(a.num - targetNum) - Math.abs(b.num - targetNum));
    const closest = numbered[0];
    const tolerance = targetNum * 0.5;
    if (Math.abs(closest.num - targetNum) > tolerance) return [];

    return numbered.filter(x => x.num === closest.num).map(x => x.p);
  }

  // No number in name (passes/memberships/etc.) — match by shared words
  const scored = candidatePool
    .map(p => ({ p, score: wordOverlapScore(fp.name, p.name) }))
    .filter(x => x.score > 0);

  if (scored.length === 0) return [];

  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  return scored.filter(x => x.score === topScore).map(x => x.p);
};

// 🔹 GAME REQUIREMENTS MAPPING
const getGameRequirements = (gameName) => {
  // Games that only need User ID
  const onlyUserId = [
    'Free Fire', 'Free Fire Max', 'PUBG Mobile', 'Honor of Kings', 'Arena of Valor',
    'Apex Legends', 'Call of Duty Mobile', 'Mobile Legends: Adventure', 'Stumble Guys',
    'Bigo Live', 'Popo Live Coins', 'Mico Live Coins', 'Brotopia', 'Modern Strike',
    'Arena Breakout', 'Lords Mobile', 'Bleach Soul Resonance', 'Crystal of Atlan',
    'Heaven Burns Red', 'Ludo Club', 'Modern Warships', 'Where Winds Meet',
    'Delta Force', 'Ragnarok Landverse Genesis', 'The Ants', 'X-Clash', 'Aether Gazer',
    'Age of Magic', 'Airplane Chefs', 'Blockman Go', 'City of Crime Gang Wars',
    'Contra Returns', 'Draconia Saga', 'Dragon Pow', 'Dragonheir Silent Gods',
    'Farlight84', 'Galaxy Attack', 'Hago', 'Hustle Castle', 'Idle Angels',
    'Kings Choice', 'Land of Empires', 'MWT Tank Battles', 'Path to Nowhere',
    'Pokemon Unite', 'Ragnarok Monster World', 'Storyngton Hall',
    'Summoners Kingdom Goddess', 'Undawn', 'War Robots', 'Wesing', 'Marvel Snap',
    'Mobile Royale', 'Indus Battle Royale', 'Marvel Rivals', 'Acecraft', 'Habi',
    '8 Ball Pool', 'Call Play', 'DC Dark Legion', 'Titan War', 'Meoo Coin',
    'Journey Renewed Fate Fantasy', 'Avatar Realms Collide', 'Top Eleven',
    'Ragnarok Crush', 'Ragnarok M Classic', 'Ragnarok Online 3', 'Oxide Survival Island',
    'Frag Pro Shooter', 'Flash Party', 'Pixel Starships', 'Funny Fighters', 'Heesay',
    'Yalla Live', 'Bermuda Video Chat', 'IMO', 'Mango Live', 'Nimo TV', 'Starmaker',
    'Uplive', 'Likee', 'Kumu', 'Chatmet', 'Veeka', 'Tango Live', 'WeTV', 'Superlive',
    'League of Legends', 'Wild Rift', 'Valorant', 'Roblox', 'Fortnite', 'Point Blank',
    'Garena Shells', 'Ragnarok X', 'Ragnarok Twilight', 'Ragnarok Idle Adventure'
  ];

  // Games that need User ID + Server ID
  const userIdAndServer = [
    'Genshin Impact', 'Zenless Zone Zero', 'Honkai Star Rail', 'Wuthering Waves',
    'Nikke', 'Tower of Fantasy', 'Blood Strike', 'Duet Night Abyss', 'EVE Echoes',
    'Love and Deepspace', 'Gran Saga', 'Alchemy Stars', 'Immortal Awakening',
    'Magic Chess GoGo', 'Mecha Break', 'Once Human', 'Puzzles and Survival',
    'Perfect World Ascend', 'Saint Seiya Awakening', 'Sweet Dance', 'Ulala Idle Adventure',
    'Watchers of Realms', 'Command & Conquer Legions', 'Age of Empires Mobile',
    'NBA Infinite', 'Jujutsu Kaisen Phantom Parade', 'Identity V', 'MU Dark Awakening',
    'Silver and Blood', 'Destiny Rising', 'Evolution 2', 'Ragnarok Twilight',
    'Castle Duels', 'Dynasty Heroes'
  ];

  // Games that need User ID + Zone ID (MLBB specific)
  const userIdAndZone = [
    'MLBB', 'Mobile Legends', 'Mobile Legends First Top-Up', 'Mobile Legends Global'
  ];

  // Games that need Code + Server + Nickname
  const codeServerNickname = [
    'Ragnarok Origin'
  ];

  // Games that need ID + Server + Nickname
  const idServerNickname = [
    'Ragnarok Idle Adventure', 'Ragnarok Twilight', 'Heartopia', 'Immortal Awakening',
    'Banishers', 'Ulala', 'Fortress Saga'
  ];

  // Games that need ID + Region + Server
  const idRegionServer = [
    'Once Human'
  ];

  // Games that need ID + Nickname
  const idNickname = [
    'Age of Apes', 'Fortress Saga', 'Tokyo Beast', 'Mirren Star Legends'
  ];

  // Games that need ID + Player Number + Name
  const idPlayerNumberName = [
    'Jawaker'
  ];

  // Games that need ID + AID + Server
  const idAidServer = [
    'Heartopia'
  ];

  // Games that need ID + Username
  const idUsername = [
    'Tokyo Beast'
  ];

  // Games that need ID + User
  const idUser = [
    'Mirren Star Legends'
  ];

  // Check which category the game falls into
  if (onlyUserId.includes(gameName)) {
    return { requiresUserId: true, requiresServer: false, requiresZone: false, requiresNickname: false };
  }

  if (userIdAndServer.includes(gameName)) {
    return { requiresUserId: true, requiresServer: true, requiresZone: false, requiresNickname: false };
  }

  if (userIdAndZone.includes(gameName)) {
    return { requiresUserId: true, requiresServer: false, requiresZone: true, requiresNickname: false };
  }

  if (codeServerNickname.includes(gameName)) {
    return { requiresUserId: false, requiresServer: true, requiresZone: false, requiresNickname: true, fieldLabel: 'Character Code' };
  }

  if (idServerNickname.includes(gameName)) {
    return { requiresUserId: true, requiresServer: true, requiresZone: false, requiresNickname: true };
  }

  if (idRegionServer.includes(gameName)) {
    return { requiresUserId: true, requiresServer: true, requiresZone: false, requiresNickname: false, fieldLabel: 'Region' };
  }

  if (idNickname.includes(gameName)) {
    return { requiresUserId: true, requiresServer: false, requiresZone: false, requiresNickname: true };
  }

  if (idPlayerNumberName.includes(gameName)) {
    return { requiresUserId: true, requiresServer: false, requiresZone: false, requiresNickname: true, fieldLabel: 'Player Number' };
  }

  if (idAidServer.includes(gameName)) {
    return { requiresUserId: true, requiresServer: true, requiresZone: false, requiresNickname: false, fieldLabel: 'AID' };
  }

  if (idUsername.includes(gameName)) {
    return { requiresUserId: false, requiresServer: false, requiresZone: false, requiresNickname: false, fieldLabel: 'Username' };
  }

  if (idUser.includes(gameName)) {
    return { requiresUserId: false, requiresServer: false, requiresZone: false, requiresNickname: false, fieldLabel: 'User' };
  }

  // Default fallback
  return { requiresUserId: true, requiresServer: false, requiresZone: false, requiresNickname: false };
};

// 🔹 GAME MAPPING (ADD HERE)
const mapGame = (p) => {
  const text = `${p.name} ${p.category}`.toLowerCase();
  const category = p.category?.toLowerCase() || '';

  // Mobile Legends
  if (text.includes('mlbb') || text.includes('mobile legend') || category === 'ml' || category === 'mlftp' || category === 'mllog') {
    return 'MLBB';
  }

  // PUBG / PUBGM
  if (text.includes('pubg') || text.includes('uc') || category === 'ucpubgm' || category === 'ucpubgmglobal' || category === 'vpubgm') {
    return 'PUBG Mobile';
  }

  // Free Fire
  if (text.includes('free fire') || text.includes('ff') || category === 'ff' || category === 'ffmax') {
    return 'Free Fire';
  }

  // Free Fire Max
  if (text.includes('free fire max')) {
    return 'Free Fire Max';
  }

  // Genshin Impact
  if (text.includes('genshin') || text.includes('crystal') || text.includes('gi') || category === 'gi' || category === 'gilog') {
    return 'Genshin Impact';
  }

  // Zenless Zone Zero
  if (text.includes('zenless') || text.includes('zzz')) {
    return 'Zenless Zone Zero';
  }

  // Honkai Star Rail
  if (text.includes('honkai') || text.includes('star rail') || category === 'hstr') {
    return 'Honkai Star Rail';
  }

  // Honor of Kings
  if (text.includes('honor of kings') || text.includes('hok') || category === 'hok') {
    return 'Honor of Kings';
  }

  // Call of Duty Mobile
  if (text.includes('cod') || text.includes('call of duty') || category === 'codm') {
    return 'Call of Duty Mobile';
  }

  // Valorant
  if (text.includes('valorant') || text.includes('val') || category === 'val') {
    return 'Valorant';
  }

  // Ragnarok series
  if (text.includes('ragnarok origin')) {
    return 'Ragnarok Origin';
  }
  if (text.includes('ragnarok idle adventure')) {
    return 'Ragnarok Idle Adventure';
  }
  if (text.includes('ragnarok x') || text.includes('ragnarok x: next generation')) {
    return 'Ragnarok X';
  }
  if (text.includes('ragnarok twilight')) {
    return 'Ragnarok Twilight';
  }
  if (text.includes('ragnarok') || text.includes('rom') || text.includes('rox') || text.includes('ror') ||
    category === 'rom' || category === 'rox' || category === 'ror' || category === 'roona' ||
    category === 'rooglobal' || category === 'rooglink' || category === 'roolna') {
    return 'Ragnarok';
  }

  // AOV (Arena of Valor)
  if (text.includes('aov') || text.includes('arena of valor') || category === 'aov') {
    return 'Arena of Valor';
  }

  // Apex Legends
  if (text.includes('apex') || category === 'apex') {
    return 'Apex Legends';
  }

  // Steam Wallet
  if (text.includes('steam') || category === 'vsteam') {
    return 'Steam';
  }

  // Razer Gold
  if (text.includes('razer') || category === 'rgold') {
    return 'Razer Gold';
  }

  // Google Play
  if (text.includes('google play') || text.includes('google')) {
    return 'Google Play';
  }

  // Nintendo
  if (text.includes('nintendo') || category === 'ntd') {
    return 'Nintendo';
  }

  // PlayStation
  if (text.includes('playstation') || text.includes('psn') || category === 'vpsn') {
    return 'PlayStation';
  }

  // Roblox
  if (text.includes('roblox') || category === 'rob') {
    return 'Roblox';
  }

  // Xbox
  if (text.includes('xbox') || category === 'vxbox') {
    return 'Xbox';
  }

  // V-Bucks (Fortnite)
  if (text.includes('vbucks') || text.includes('fortnite')) {
    return 'Fortnite';
  }

  // Stumble Guys
  if (text.includes('stumble') || category === 'sgvgp') {
    return 'Stumble Guys';
  }

  // Mobile Legends: Adventure (MLA)
  if (text.includes('mla') || text.includes('adventure')) {
    return 'Mobile Legends: Adventure';
  }

  // Tower of Fantasy
  if (text.includes('tower of fantasy') || text.includes('tof') || category === 'tof' || category === 'toflog') {
    return 'Tower of Fantasy';
  }

  // Wuthering Waves
  if (text.includes('wuthering') || text.includes('ww')) {
    return 'Wuthering Waves';
  }

  // Arena Breakout
  if (text.includes('arena breakout') || text.includes('ab')) {
    return 'Arena Breakout';
  }

  // League of Legends
  if (text.includes('league of legends') || text.includes('lol') || category === 'lol') {
    return 'League of Legends';
  }

  // Wild Rift
  if (text.includes('wild rift') || text.includes('wildrift')) {
    return 'Wild Rift';
  }

  // Pokemon Unite
  if (text.includes('pokemon unite')) {
    return 'Pokemon Unite';
  }

  // Nikke
  if (text.includes('nikke')) {
    return 'Nikke';
  }

  // Blood Strike
  if (text.includes('blood strike')) {
    return 'Blood Strike';
  }

  // Once Human
  if (text.includes('once human')) {
    return 'Once Human';
  }

  // Identity V
  if (text.includes('identity v')) {
    return 'Identity V';
  }

  // Others that have specific categories
  if (category === 'bigo') return 'Bigo Live';
  if (category === 'vid') return 'Vidio';
  if (category === 'viu') return 'Viu';
  if (category === 'tsel' || category === 'xl' || category === 'isat' || category === 'tri' || category === 'smartf') return 'Pulsa';
  if (category === 'tpln') return 'Token PLN';
  if (category === 'gopay' || category === 'dana' || category === 'ovo') return 'E-Wallet';
  if (category === 'vgs') return 'Garena Shells';
  if (category === 'vpb') return 'Point Blank';

  return 'Other';
};

// 🔹 AXIOS INSTANCE (REUSABLE)
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 🔧 15s → 30s (Lapak slow on large regions like 'id')
  headers: {
    Accept: 'application/json'
  }
});
axiosRetry(api, {
  retries: 3,
  retryDelay: (count) => count * 1500,
  retryCondition: (error) =>
    error.code === 'EAI_AGAIN' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNABORTED' || // 🔧 timeout errors now retried
    axiosRetry.isNetworkOrIdempotentRequestError(error)
});
// 🔹 AUTH HEADER HELPER (supports both formats)
const getAuthHeaders = () => ({
  Authorization: `Bearer ${API_KEY}`, // default

});

// 🔹 FETCH CATEGORIES
exports.fetchCategories = async () => {
  try {
    const res = await api.get('/api/category', {
      headers: getAuthHeaders(),
      params: {
        country_code: 'id'
      }
    });

    return res.data?.data?.categories || [];

  } catch (error) {
    console.error('❌ Fetch Categories Error:', error.response?.data || error.message);
    throw error;
  }
};

// 🔹 DERIVE REQUIREMENTS FROM FORMS
const deriveRequirementsFromForms = (forms = []) => {
  return {
    requiresUserId: forms.some(f => f.name === 'user_id'),
    requiresServer: forms.some(f => f.name === 'server_id' || f.name === 'additional_id'),
    requiresZone: forms.some(f => f.name === 'zone_id'),
    requiresNickname: forms.some(f => f.name === 'nickname')
  };
};

// 🔹 SYNC CATEGORIES
exports.syncCategories = async () => {
  try {

    const supplierCategories = await exports.fetchCategories();

    const ops = FIXED_CATEGORIES.map(c => {

      const supplierCategory = supplierCategories.find(
        s => s.code === c.code
      );

      return {
        updateOne: {
          filter: { code: c.code },
          update: {
            $set: {
              code: c.code,
              name: c.name,

              // ✅ Manual forms from supplier-categories.js
              forms: c.forms || [],

              // ✅ Auto detect if server field exists
              hasServer:
                c.forms?.some(
                  f => f.name === 'server_id'
                ) || false,

              gameInformation:
                c.gameInformation || [],

              slug: slugify(c.name),

              game: c.name,

              isActive: true,

              image:
                supplierCategory?.image || null
            }
          },
          upsert: true
        }
      };
    });

    await Category.bulkWrite(ops);

    return {
      success: true,
      total: ops.length
    };

  } catch (error) {
    console.error(
      'Category Sync Error:',
      error
    );
    throw error;
  }
};
// 🔹 FETCH PRODUCTS
exports.fetchProducts = async () => {
  try {

    // ✅ All supported regions
    const regions = ['id', 'my', 'ph', 'th', 'us', 'br', 'vn'];

    let allProducts = [];

    for (const region of regions) {

      try {

        console.log(`🌍 Fetching region: ${region}`);

        const res = await api.get('/api/all-products', {
          headers: getAuthHeaders(),
          params: {
            country_code: region
          }
        });

        const products = res.data?.data?.products || [];

        console.log(`✅ ${region.toUpperCase()} => ${products.length} products`);

        // tag region
        products.forEach(p => {
          p._region = region;
        });

        allProducts.push(...products);

      } catch (err) {

        console.log(`❌ ${region.toUpperCase()} failed: ${err.message}`);

      }
    }

    // ✅ Remove exact duplicates
    const seen = new Set();

    const uniqueProducts = allProducts.filter(p => {

      const key = p.code;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;

    });
    console.log('SAMPLE KEYS:', Object.keys(uniqueProducts[0]));
    console.log('SAMPLE PRODUCT:', JSON.stringify(uniqueProducts[0], null, 2));

    console.log('═══════════════════════════════');
    console.log(`📦 FINAL UNIQUE PRODUCTS: ${uniqueProducts.length}`);
    console.log('═══════════════════════════════');

    return uniqueProducts;

  } catch (error) {

    console.error(
      '❌ Fetch Products Error:',
      error.response?.data || error.message
    );

    throw error;
  }
};


// 🔹 SYNC PRODUCTS
const IDR_TO_BRL = 0.00029;

exports.syncProducts = async () => {
  try {
    console.log('═══════════════════════════════════════');
    console.log('🚀 SYNC STARTED');
    console.log('═══════════════════════════════════════');

    const products = await exports.fetchProducts();

    // 🔍 TEMP DEBUG — dump ALL unique groups under suspected real category_codes
    // (avoids keyword noise like "crystal" matching Tower of Fantasy products)
    // Remove this block once ZZZ/Genshin codes are finalized in supplier-games.js
    const DEBUG_CATEGORY_CODES = ['ZZZLOG', 'ZZZ', 'HSTRLOG', 'GILOG', 'GI'];

    DEBUG_CATEGORY_CODES.forEach(catCode => {
      const matches = products.filter(p => p.category_code === catCode);

      // dedupe by group_product_code so we see each denomination once
      const seenGroups = new Set();
      const uniqueGroups = matches.filter(p => {
        if (seenGroups.has(p.group_product_code)) return false;
        seenGroups.add(p.group_product_code);
        return true;
      });

      console.log(`\n🔍 [category_code = ${catCode}] → ${matches.length} total, ${uniqueGroups.length} unique groups`);
      uniqueGroups.slice(0, 30).forEach(p => {
        console.log(`   group=${p.group_product_code} | code=${p.code} | name="${p.name}" | price=${p.price} | status=${p.status}`);
      });
    });

    // 🔍 TEMP DEBUG — Valorant: search by code prefix instead of name
    // (names are just "375 VP" etc, won't contain the word "valorant")
    const valMatches = products.filter(p => p.code?.startsWith('VVAL'));
    console.log(`\n🔍 [Valorant VP] code prefix "VVAL" → ${valMatches.length} matches`);
    valMatches.slice(0, 20).forEach(p => {
      console.log(`   code=${p.code} | group=${p.group_product_code} | category_code=${p.category_code} | name="${p.name}" | price=${p.price} | status=${p.status}`);
    });


    const categories = await Category.find({});
    const categoryMap = {};

    categories.forEach(c => {

      categoryMap[c.code] = c;

      // ✅ HSR aliases
      if (c.code === 'HSR') {
        categoryMap['HSTR'] = c;
        categoryMap['HSTRLOG'] = c;
        categoryMap['HSTRUS'] = c;
        categoryMap['HSTRVGP'] = c;
      }

      // ✅ GENSHIN aliases
      if (c.code === 'GENSHIN') {
        categoryMap['GI'] = c;
        categoryMap['GILOG'] = c;
        categoryMap['GIUS'] = c;
        categoryMap['GIVGP'] = c;
      }

      // ✅ ZZZ aliases
      if (c.code === 'ZZZ') {
        categoryMap['ZZZUS'] = c;
      }

    });



    const stats = {
      total: FIXED_PRODUCTS.length,
      matched: 0,
      missing: 0,
      missingNames: [],
      totalSavings: 0,
      created: 0,
      updated: 0
    };

    const ops = [];

    for (const fp of FIXED_PRODUCTS) {

      // 🔧 FIX: match by base code (provider-agnostic) instead of exact
      // full supplierId, since Lapak's provider/region suffix (e.g. -S116-br)
      // changes over time as cheapest providers rotate or go out of stock.
      const baseCode = getBaseCode(fp.supplierId);

      const allProviders = products.filter(p =>
        getBaseCode(p.code) === baseCode &&
        p.price > 0 &&
        p.status !== 'empty'
      );

      let usedFuzzyMatch = false;

      // 🧩 FUZZY FALLBACK — exact code didn't match (supplier renamed/
      // restructured it). Look for the closest equivalent in the same
      // product family before giving up. This auto-adopted match goes
      // live immediately (no manual review), per agreed behavior.
      if (allProviders.length === 0) {
        const fuzzyMatches = findFuzzyCandidates(fp, products);
        if (fuzzyMatches.length > 0) {
          allProviders.push(...fuzzyMatches);
          usedFuzzyMatch = true;
          stats.fuzzyMatched = (stats.fuzzyMatched || 0) + 1;
          console.log(`🧩 ${fp.name} (${baseCode}) → exact code gone, fuzzy-matched to:`, fuzzyMatches.map(p => p.code));
        }
      }

      if (allProviders.length === 0) {

        // 🔍 DEBUG: temporary — log similar codes to help diagnose remaining misses
        const similar = products.filter(p => getBaseCode(p.code).startsWith(baseCode.slice(0, 3)));
        console.log(`🔎 ${fp.name} (${baseCode}) → similar codes found:`, similar.map(p => p.code).slice(0, 5));

        stats.missing++;
        stats.missingNames.push(fp.name);

        console.log(`❌ ${fp.name} → no providers`);

        // ✅ mark unavailable in DB — upsert so the product exists with the
        // CONFIG name even if it has never matched a supplier before.
        // Without upsert, a product that never synced once would just be
        // invisible in the admin panel instead of showing as "unavailable".
        const missingCategory = categoryMap[fp.supplierCategory];

        await Product.findOneAndUpdate(
          {
            supplierCategory: fp.supplierCategory,
            name: fp.name
          },
          {
            $set: {
              isSupplierAvailable: false
            },
            $setOnInsert: {
              name: fp.name,
              displayName: fp.name,
              supplierCategory: fp.supplierCategory,
              category: missingCategory?._id,
              categoryName: missingCategory?.name,
              price: 0,
              isActive: true,
              featured: false,
              markup: 0,
              requiresUserId: true,
              requiresServer: true,
              requiresZone: false,
              requiresNickname: false
            }
          },
          { upsert: true }
        );

        continue;
      }

      // ✅ OUTLIER FILTER — drop providers priced way above median (fake placeholder prices)
      allProviders.sort((a, b) => a.price - b.price);
      const prices = allProviders.map(p => p.price);
      const median = prices[Math.floor(prices.length / 2)];
      const providers = allProviders.filter(p => p.price <= median * 3);

      if (providers.length === 0) {
        stats.missing++;
        stats.missingNames.push(fp.name);
        console.log(`⚠️  ${fp.name} → all outliers, skipped`);
        continue;
      }

      const cheapest = providers[0];
      const mostExpensive = providers[providers.length - 1];

      const savedBRL = (mostExpensive.price - cheapest.price) * IDR_TO_BRL;
      stats.totalSavings += savedBRL;
      stats.matched++;

      const brlPrice = Math.max(1, Math.ceil(cheapest.price * IDR_TO_BRL));



      const allProvidersData = providers.map(p => ({
        code: p.provider_code,
        fullCode: p.code,
        price: p.price,
        converted: parseFloat((p.price * IDR_TO_BRL).toFixed(2)),
        status: p.status
      }));

      const category = categoryMap[fp.supplierCategory];
      // Save forms from Lapak product into category
if (
  category &&
  cheapest.forms &&
  cheapest.forms.length > 0
) {
  await Category.updateOne(
    { _id: category._id },
    {
      $set: {
        forms: cheapest.forms
      }
    }
  );
}

      // 🔑 Filter: match by group_product_code + game (so suppliers can change, product stays)
      // NOT by supplierId — because cheapest provider may change between syncs
      const productFilter = {
        supplierCategory: fp.supplierCategory,
        name: fp.name
      };

      ops.push({
        updateOne: {
          filter: productFilter,
          update: {
            // 🔄 $set — sirf SYNC fields (admin's customizations untouched)
            $set: {
              supplierId: cheapest.code,
              supplierCategory: fp.supplierCategory,
              providerCode: cheapest.provider_code,
              supplierPriceRaw: cheapest.price,
              allProviders: allProvidersData,
              customPrice: null,
              price: brlPrice,
              category: category?._id,
              categoryName: category?.name,
              lastSyncedAt: new Date(),
              isSupplierAvailable: true,
              customPrice: null,
            },
            $setOnInsert: {
              name: fp.name,
              displayName: fp.name,
              isActive: true,
              featured: false,
              markup: 0,
              requiresUserId: true,
              requiresServer: true,
              requiresZone: false,
              requiresNickname: false
            }
          },
          upsert: true
        }
      });
    }

    // ============================================================
    // 🆕 AUTO-DISCOVERY — catch new/untracked products per category
    // ============================================================
    // For every category we manage, find Lapak's real category_code
    // aliases (already built above in categoryMap), gather every group
    // Lapak currently sells under those aliases, and for any group NOT
    // already covered by FIXED_PRODUCTS, auto-create it as a live
    // product using Lapak's own name + cheapest available price.
    //
    // ⚠️ No manual review step — this goes straight to isActive:true.
    // If Lapak's lineup includes something irrelevant (a subscription
    // bundle, a different-currency gift card, etc.) it WILL show up on
    // the website. Deactivate it from the admin panel if that happens —
    // no file edit / redeploy needed.

    // Build: internal category code -> Set of Lapak category_code aliases
    const aliasesByInternalCode = {};
    Object.keys(categoryMap).forEach(lapakCode => {
      const internalCode = categoryMap[lapakCode].code;
      if (!aliasesByInternalCode[internalCode]) {
        aliasesByInternalCode[internalCode] = new Set();
      }
      aliasesByInternalCode[internalCode].add(lapakCode);
    });

    // Build: internal category code -> Set of base codes already tracked
    // by FIXED_PRODUCTS (so we don't duplicate-create what's already managed)
    const trackedBaseCodesByCategory = {};
    FIXED_PRODUCTS.forEach(fp => {
      if (!trackedBaseCodesByCategory[fp.supplierCategory]) {
        trackedBaseCodesByCategory[fp.supplierCategory] = new Set();
      }
      trackedBaseCodesByCategory[fp.supplierCategory].add(getBaseCode(fp.supplierId));
    });

    stats.autoDiscovered = 0;
    stats.autoDiscoveredNames = [];
    const autoOps = [];
    const seenGroupCodesThisRun = new Set();

    for (const internalCode of Object.keys(aliasesByInternalCode)) {

      const aliases = aliasesByInternalCode[internalCode];
      const trackedBaseCodes = trackedBaseCodesByCategory[internalCode] || new Set();
      const category = categoryMap[internalCode];

      // all Lapak products under any alias of this category
      const categoryProducts = products.filter(p => aliases.has(p.category_code));

      // group by Lapak's own group_product_code (cleaner than re-deriving base code)
      const groupCodes = new Set(categoryProducts.map(p => p.group_product_code));

      groupCodes.forEach(groupCode => {
        if (!groupCode) return;
        if (trackedBaseCodes.has(groupCode)) return; // already managed by FIXED_PRODUCTS
        if (seenGroupCodesThisRun.has(groupCode)) return; // already auto-added this run

        const groupProviders = categoryProducts.filter(p =>
          p.group_product_code === groupCode &&
          p.price > 0 &&
          p.status !== 'empty'
        );

        if (groupProviders.length === 0) return; // nothing in stock right now, skip silently

        groupProviders.sort((a, b) => a.price - b.price);
        const gPrices = groupProviders.map(p => p.price);
        const gMedian = gPrices[Math.floor(gPrices.length / 2)];
        const validProviders = groupProviders.filter(p => p.price <= gMedian * 3);
        if (validProviders.length === 0) return;

        const cheapest = validProviders[0];
        const brlPrice = Math.max(1, Math.ceil(cheapest.price * IDR_TO_BRL));
        const productName = cheapest.name; // use Lapak's own name — not in our config

        const allProvidersData = validProviders.map(p => ({
          code: p.provider_code,
          fullCode: p.code,
          price: p.price,
          converted: parseFloat((p.price * IDR_TO_BRL).toFixed(2)),
          status: p.status
        }));

        seenGroupCodesThisRun.add(groupCode);
        stats.autoDiscovered++;
        stats.autoDiscoveredNames.push(`${productName} (${internalCode})`);

        autoOps.push({
          updateOne: {
            filter: {
              supplierCategory: internalCode,
              name: productName
            },
            update: {
              $set: {
                supplierId: cheapest.code,
                supplierCategory: internalCode,
                providerCode: cheapest.provider_code,
                supplierPriceRaw: cheapest.price,
                allProviders: allProvidersData,
                customPrice: null,
                price: brlPrice,
                category: category?._id,
                categoryName: category?.name,
                lastSyncedAt: new Date(),
                isSupplierAvailable: true
              },
              $setOnInsert: {
                name: productName,
                displayName: productName,
                isActive: true, // 🆕 straight to live, no review
                featured: false,
                markup: 0,
                requiresUserId: true,
                requiresServer: true,
                requiresZone: false,
                requiresNickname: false
              }
            },
            upsert: true
          }
        });
      });
    }

    if (autoOps.length > 0) {
      console.log(`\n🆕 AUTO-DISCOVERED ${autoOps.length} new product(s):`);
      stats.autoDiscoveredNames.forEach(n => console.log(`   + ${n}`));
      const autoResult = await Product.bulkWrite(autoOps);
      stats.autoCreated = autoResult.upsertedCount || 0;
      stats.autoUpdated = autoResult.modifiedCount || 0;
    }

    if (ops.length > 0) {
      const result = await Product.bulkWrite(ops);
      stats.created = result.upsertedCount || 0;
      stats.updated = result.modifiedCount || 0;
    }

    console.log('\n════════ SYNC SUMMARY ════════');

    console.log(`✅ Synced: ${stats.matched}`);
    console.log(`🧩 Fuzzy-matched (code changed on supplier side): ${stats.fuzzyMatched || 0}`);
    console.log(`❌ Missing: ${stats.missing}`);
    console.log(`🆕 Auto-discovered: ${stats.autoDiscovered || 0}`);

    if (stats.missingNames.length) {

      console.log('\nUnavailable Products:\n');

      stats.missingNames.forEach(name => {
        console.log(`- ${name}`);
      });

    }

    console.log('\n══════════════════════════════\n');

    return {
      success: true,
      ...stats,
      totalSavings: parseFloat(stats.totalSavings.toFixed(2))
    };

  } catch (error) {
    console.error('❌ Sync Products Error:', error);
    throw error;
  }
};
// 🔹 CHECK USER ID (USERNAME VALIDATION)
exports.checkUserId = async ({ categoryCode, userId, serverId, nickname }) => {
  try {

    if (!serverId) {
      console.log('❌ SERVER MISSING');
      return {
        success: false,
        message: 'Server required'
      };
    }

    const params = {
      category_code: categoryCode,
      user_id: userId,
      additional_id: serverId
    };

    if (nickname) {
      params.additional_information = nickname;
    }

    console.log('📤 FINAL PARAMS:', params);

    const res = await api.post('/api/uid-check', null, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'X-COUNTRY': 'id'
      },
      params
    });

    console.log('📥 RESPONSE:', res.data);

    if (res.data.code !== 'SUCCESS') {
      console.log('❌ INVALID USER');
      return { success: false };
    }

    console.log('✅ VALID USER:', res.data.data);

    return {
      success: true,
      username: res.data.data?.name || null
    };

  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    throw error;
  }
};
// 🔹 CREATE ORDER
// supplier.service.js - FIXED createOrder function



exports.createOrder = async (order, product) => {
  if (!order.userIpAddress) {
    throw new Error('User IP missing');
  }

  try {
    const email =
      order.email || `guest_${order._id}@sdshop.com`;

    // fix localhost ip
    const ip =
      order.userIpAddress === '::1'
        ? '139.135.44.196'
        : order.userIpAddress;

    // ✅ FINAL CORRECT PAYLOAD (JSON)
    const payload = {
      product_code: product.supplierId,
      count_order: product.bundleQuantity || 1,
      partner_reference_id: order._id.toString(),
      end_user_ip_address: ip,

      payer: {
        user_id: order.user ? order.user.toString() : 'guest',
        email: email
      },

      user_id: order.userGameId,
      additional_id: order.serverId
    };

    // optional nickname
    if (order.nickname && order.nickname.trim() !== '') {
      payload.additional_information = order.nickname;
    }

    console.log('📤 FINAL JSON:', payload);

    // ✅ IMPORTANT: use api (not axios)
    const res = await api.post('/api/order', payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'X-COUNTRY': 'id',
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    console.log('📦 LAPAK RESPONSE:', res.data);

    if (res.data.code !== 'SUCCESS') {
      throw new Error(JSON.stringify(res.data));
    }

    const supplierData = res.data.data;

    // save response
    order.supplierTid = supplierData.tid;
    order.supplierStatus = 'processing';
    order.supplierResponse = res.data;

    await order.save();

    return supplierData;

  } catch (error) {

    if (error.code === 'EAI_AGAIN') {
      console.log('🔁 DNS issue, retry handled automatically');
    }

    console.error('❌ Create Order Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    throw error;
  }
};

// 🔹 WEBHOOK HANDLER
exports.webhook = async (req, res) => {
  try {
    const data = req.body;

    const ref = data.data?.reference_id || data.reference_id;
    const status = data.data?.status || data.status;

    if (!ref) return res.json({ message: 'OK' });

    const order = await Order.findById(ref);
    if (!order) return res.json({ message: 'OK' });

    if (order.supplierStatus === 'completed') {
      return res.json({ message: 'OK' });
    }

    if (status === 'SUCCESS') {
      order.status = 'paid';
      order.supplierStatus = 'completed';
    } else if (['FAILED', 'REFUNDED'].includes(status)) {
      order.status = 'failed';
      order.supplierStatus = 'failed';
    } else {
      order.supplierStatus = 'processing';
    }

    order.supplierResponse = data;
    await order.save();

    return res.json({ message: 'OK' });

  } catch (error) {
    console.error('❌ Webhook Error:', error.message);
    return res.status(500).json({ message: 'Error' });
  }
};

// Export helper functions for use in other modules
exports.getGameRequirements = getGameRequirements;
exports.mapGame = mapGame;