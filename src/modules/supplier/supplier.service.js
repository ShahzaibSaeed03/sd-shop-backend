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
  timeout: 15000,
  headers: {
    Accept: 'application/json'
  }
});
axiosRetry(api, {
  retries: 3,
  retryDelay: (count) => count * 1000,
  retryCondition: (error) =>
    error.code === 'EAI_AGAIN' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ENOTFOUND'
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

    // Lapak categories
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

              // 🔥 forms from Lapak
              forms: supplierCategory?.forms || [],

              // optional
              hasServer: supplierCategory?.hasServer || false,

              gameInformation: c.gameInformation || [],
              slug: slugify(c.name),
              game: c.name,
              isActive: true
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
    console.error(error);
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

      const allProviders = products.filter(p =>
        p.code === fp.supplierId &&
        p.price > 0 &&
        p.status !== 'empty'
      );

      if (allProviders.length === 0) {

        stats.missing++;
        stats.missingNames.push(fp.name);

        console.log(`❌ ${fp.name} → no providers`);

        // ✅ mark unavailable in DB
        await Product.findOneAndUpdate(
          {
            supplierCategory: fp.supplierCategory,
            name: fp.name
          },
          {
            isSupplierAvailable: false
          }
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

    if (ops.length > 0) {
      const result = await Product.bulkWrite(ops);
      stats.created = result.upsertedCount || 0;
      stats.updated = result.modifiedCount || 0;
    }

    console.log('\n════════ SYNC SUMMARY ════════');

    console.log(`✅ Synced: ${stats.matched}`);
    console.log(`❌ Missing: ${stats.missing}`);

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