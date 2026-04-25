const qs = require('qs'); 
const axios = require('axios');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
const Category = require('../categorey/category.model');
const { slugify } = require('../../utils/slugify');

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
        country_code: 'br'
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
    // ✅ FIXED (CLIENT REQUIRED)
    const FIXED_CATEGORIES = [
      {
        code: 'HSTR',
        name: 'Honkai Star Rail',
        forms: [
          { name: 'user_id', type: 'text' },
          {
            name: 'additional_id',
            type: 'option',
            options: [
              { value: 'Asia', name: 'Asia' },
              { value: 'America', name: 'America' },
              { value: 'Europe', name: 'Europe' },
              { value: 'TW_HK_MO', name: 'TW_HK_MO' }
            ]
          }
        ]
      },

      {
        code: 'GI',
        name: 'Genshin Impact',
        forms: [
          { name: 'user_id', type: 'text' },
          {
            name: 'additional_id',
            type: 'option',
            options: [
              { value: 'America', name: 'America' },
              { value: 'Asia', name: 'Asia' },
              { value: 'Europe', name: 'Europe' },
              { value: 'TW_HK_MO', name: 'TW_HK_MO' }
            ]
          }
        ]
      },

      {
        code: 'ZZZ',
        name: 'Zenless Zone Zero',
        forms: [
          { name: 'user_id', type: 'number' },
          {
            name: 'additional_id',
            type: 'option',
            options: [
              { value: 'America', name: 'America' },
              { value: 'Asia', name: 'Asia' },
              { value: 'Europe', name: 'Europe' },
              { value: 'TW_HK_MO', name: 'TW_HK_MO' }
            ]
          }
        ]
      },

      {
        code: 'WW',
        name: 'Wuthering Waves',
        forms: [
          { name: 'user_id', type: 'number' },
          {
            name: 'additional_id',
            type: 'option',
            options: [
              { value: 'SEA', name: 'SEA' },
              { value: 'Asia', name: 'Asia' },
              { value: 'America', name: 'America' },
              { value: 'Europe', name: 'Europe' },
              { value: 'TW_HK_MO', name: 'TW_HK_MO' }
            ]
          }
        ]
      }
    ];

    const ops = FIXED_CATEGORIES.map(c => ({
      updateOne: {
        filter: { code: c.code },
        update: {
          $set: {
            code: c.code,
            name: c.name,
            forms: c.forms,   // ✅ now correct
            slug: slugify(c.name),
            game: c.name,
            isActive: true
          }
        },
        upsert: true
      }
    }));

    // ❌ remove all other categories
    await Category.deleteMany({
      code: { $nin: FIXED_CATEGORIES.map(c => c.code) }
    });

    await Category.bulkWrite(ops);

    return {
      success: true,
      total: FIXED_CATEGORIES.length
    };

  } catch (error) {
    console.error('❌ Sync Categories Error:', error.message);
    throw error;
  }
};
// 🔹 FETCH PRODUCTS
exports.fetchProducts = async () => {
  try {
    const res = await api.get('/api/all-products', {
      headers: getAuthHeaders(),
      params: {
        country_code: 'br'
      }
    });

    console.log('📦 FULL RESPONSE:', res.data);

    return res.data?.data?.products || []; // ✅ FIX HERE

  } catch (error) {
    console.error('❌ Fetch Products Error:', error.response?.data || error.message);
    throw error;
  }
};


// 🔹 SYNC PRODUCTS
const IDR_TO_BRL = 0.00029;

exports.syncProducts = async () => {
  try {
    const products = await exports.fetchProducts();

    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.code] = c;
    });

    // ✅ CLIENT FIXED PRODUCTS
    const FIXED_PRODUCTS = [
      // ---------------- HSR ----------------
      { code: 'HSTRESP-S117-br', name: 'Express Supply Pass', game: 'HSTR' },
      { code: 'HSTR60-S116-br', name: '60 Oneiric Shard', game: 'HSTR' },
      { code: 'HSTR300-S117-br', name: '300 + 30 Oneiric Shard', game: 'HSTR' },
      { code: 'HSTR980-S117-br', name: '980 + 110 Oneiric Shard', game: 'HSTR' },
      { code: 'HSTR1980-S117-br', name: '1980 + 260 Oneiric Shard', game: 'HSTR' },
      { code: 'HSTR3280-S116-br', name: '3280 + 600 Oneiric Shard', game: 'HSTR' },
      { code: 'HSTR6480-S116-br', name: '6480 + 1600 Oneiric Shard', game: 'HSTR' },

      // ---------------- GI ----------------
      { code: 'GIWELKIN-S113-br', name: 'Blessing Welkin Moon', game: 'GI' },
      { code: 'GI60-S113-br', name: '60 Crystals', game: 'GI' },
      { code: 'GI330-S113-br', name: '300 + 30 Crystals', game: 'GI' },
      { code: 'GI1090-S113-br', name: '980 + 110 Crystals', game: 'GI' },
      { code: 'GI2240-S113-br', name: '1980 + 260 Crystals', game: 'GI' },
      { code: 'GI3940-S27-br', name: '3280 + 600 Crystals', game: 'GI' },
      { code: 'GI8080-S113-br', name: '6480 + 1600 Crystals', game: 'GI' },

      // ---------------- ZZZ ----------------
      { code: 'ZZZPASS-S1-br', name: 'Inter-Knot Membership', game: 'ZZZ' },
      { code: 'ZZZ60-S1-br', name: '60 Monochrome', game: 'ZZZ' },
      { code: 'ZZZ300-S116-br', name: '300 + 30 Monochrome', game: 'ZZZ' },
      { code: 'ZZZ980-S117-br', name: '980 + 110 Monochrome', game: 'ZZZ' },
      { code: 'ZZZ1980-S116-br', name: '1980 + 260 Monochrome', game: 'ZZZ' },
      { code: 'ZZZ3280-S117-br', name: '3280 + 600 Monochrome', game: 'ZZZ' },
      { code: 'ZZZ6480-S116-br', name: '6480 + 1600 Monochrome', game: 'ZZZ' },

      // ---------------- WW (CLIENT PROVIDED) ----------------
      { code: 'WUTWVSLS1-S96A', name: 'Lunite Subscription', game: 'WW' },
      { code: 'WUTWVS60-S96A', name: '60 Lunites', game: 'WW' },
      { code: 'WUTWVS300-S96A', name: '300 Lunites', game: 'WW' },
      { code: 'WUTWVS980-S96A', name: '980 Lunites', game: 'WW' },
      { code: 'WUTWVS1980-S96A', name: '1980 Lunites', game: 'WW' },
      { code: 'WUTWVS3280-S19', name: '3280 Lunites', game: 'WW' },
      { code: 'WUTWVS6480-S19', name: '6480 Lunites', game: 'WW' }
    ];

    // ✅ MATCH FROM SUPPLIER RESPONSE
    const finalProducts = FIXED_PRODUCTS.map(fp => {
      const found = products.find(p => p.code === fp.code);

      return {
        ...fp,
        price: found?.price || 0,
        supplierCategory: found?.category_code || fp.game
      };
    });

    // ✅ SAVE
    const ops = finalProducts.map(p => {
      const category = categoryMap[p.game];

      return {
        updateOne: {
          filter: { supplierId: p.code }, // 🔑 unique key
          update: {
            name: p.name,
            displayName: p.name,

            supplierId: p.code,
            supplierCategory: p.supplierCategory,

            price: Math.max(1, Math.ceil(p.price * 0.00029)),

            category: category?._id,
            categoryName: category?.name,

            isActive: true
          },
          upsert: true
        }
      };
    });

    await Product.bulkWrite(ops);



    return {
      success: true,
      total: finalProducts.length
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
        'X-COUNTRY': 'br'
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
    const guestEmail = order.email || `guest_${order._id}@sdshop.com`;

    // ✅ FLATTENED PAYLOAD (IMPORTANT)
    const payload = {
      count_order: 1,
      product_code: product.supplierId,
      partner_reference_id: order._id.toString(),
      end_user_ip_address: order.userIpAddress || "139.135.44.196",

      // 🔥 CRITICAL (MUST BE FLAT)
      'payer[user_id]': order.user ? order.user.toString() : 'guest',
      'payer[email]': guestEmail
    };

    // ✅ GAME DATA
    if (order.userGameId) {
      payload.user_id = order.userGameId;
    }

    if (order.serverId) {
      payload.additional_id = order.serverId;
    }

    if (order.nickname) {
      payload.additional_information = order.nickname;
    }

    // 🔍 DEBUG
    console.log("📤 FINAL FORM DATA:", qs.stringify(payload));

    const res = await axios.post(
      `${BASE_URL}/api/order`,
      qs.stringify(payload), // 🔥 MUST
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'X-COUNTRY': 'br',

          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',

          // 🔥 REQUIRED (Cloudflare bypass)
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://www.lapakgaming.com',
          'Referer': 'https://www.lapakgaming.com/'
        }
      }
    );

    console.log('📦 LAPAK RESPONSE:', res.data);

    if (res.data.code !== 'SUCCESS') {
      throw new Error(res.data.message || JSON.stringify(res.data));
    }

    const supplierData = res.data.data;

    order.supplierTid = supplierData.tid;
    order.supplierStatus = 'processing';
    order.supplierResponse = res.data;

    await order.save();

    return supplierData;

  } catch (error) {
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