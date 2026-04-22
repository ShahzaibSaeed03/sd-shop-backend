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
    const categories = await exports.fetchCategories();

    // ✅ ONLY ALLOWED CATEGORIES
    const allowedCodes = ['HSTR', 'GI', 'ZZZ', 'WW'];

    const filtered = categories.filter(c =>
      allowedCodes.includes(c.code)
    );

    const ops = filtered.map(c => {
      const requirements = deriveRequirementsFromForms(c.forms);

      return {
        updateOne: {
          filter: { code: c.code },
          update: {
            code: c.code,
            name: c.name,
            slug: slugify(c.name),
            game: c.name,

            supplierCode: c.code,
            country: c.country_code,

            isActive: true,

            ...requirements,

            rawForms: c.forms || [],
            rawServers: c.servers || []
          },
          upsert: true
        }
      };
    });

    // 🧹 REMOVE OLD WRONG CATEGORIES
    await Category.deleteMany({
      code: { $nin: allowedCodes }
    });

    await Category.bulkWrite(ops);

    return {
      success: true,
      total: filtered.length
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

    const TARGET_GAMES = {
      HSTR: {
        name: 'Honkai Star Rail',
        keys: {
          express: 'HSTRESP',
          '60': 'HSTR60',
          '300': 'HSTR300',
          '980': 'HSTR980',
          '1980': 'HSTR1980',
          '3280': 'HSTR3280',
          '6480': 'HSTR6480'
        }
      },

      GI: {
        name: 'Genshin Impact',
        keys: {
          express: 'WELKIN',
          '60': 'GI60',
          '300': 'GI300',
          '980': 'GI980',
          '1980': 'GI1980',
          '3280': 'GI3280',
          '6480': 'GI6480'
        }
      },

      ZZZ: {
        name: 'Zenless Zone Zero',
        keys: {
          express: 'ZZZPASS', // or Inter-Knot Membership
          '60': 'ZZZ60',
          '300': 'ZZZ300',
          '980': 'ZZZ980',
          '1980': 'ZZZ1980',
          '3280': 'ZZZ3280',
          '6480': 'ZZZ6480'
        }
      },

      // ✅ ADD THIS
      WW: {
        name: 'Wuthering Waves',
        keys: {
          express: 'WWPASS', // sometimes "lunite subscription"
          '60': 'WW60',
          '300': 'WW300',
          '980': 'WW980',
          '1980': 'WW1980',
          '3280': 'WW3280',
          '6480': 'WW6480'
        }
      }
    };

    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.code] = c;
    });

    const allFinalProducts = [];

    // 🔥 LOOP ALL GAMES
    for (const [code, game] of Object.entries(TARGET_GAMES)) {

      const gameProducts = products.filter(p =>
        p.category_code === code || p.code?.startsWith(code)
      );

      const groups = {};

      gameProducts.forEach(p => {
        for (const [key, pattern] of Object.entries(game.keys)) {
          const name = p.name?.toLowerCase() || '';
          const code = p.code || '';

          if (
            code.includes(pattern) ||
            name.includes(key) ||
            name.includes('lunite') || // ✅ important for WW
            name.includes('wuthering')
          ) {
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
          }
        }
      });

      // ✅ PICK CHEAPEST
      const cheapest = Object.values(groups).map(list =>
        list.sort((a, b) => a.price - b.price)[0]
      );

      cheapest.forEach(p => {
        allFinalProducts.push({
          ...p,
          gameName: game.name
        });
      });
    }

    // ✅ SAVE
    const ops = allFinalProducts.map(p => {
      const category = categoryMap[p.category_code];

      return {
        updateOne: {
          filter: { supplierId: p.code },
          update: {
            name: p.name,

            // 🔥 Portuguese fix later (optional)
            displayName: p.name,

            supplierId: p.code,
            supplierCategory: p.category_code,

            price: Math.max(1, Math.ceil(p.price * 0.00029)),

            category: category?._id,
            categoryName: category?.name,

            isActive: true
          },
          upsert: true
        }
      };
    });

    await Product.deleteMany({});
    await Product.bulkWrite(ops);

    return {
      success: true,
      total: allFinalProducts.length
    };

  } catch (error) {
    console.error('❌ Sync Products Error:', error);
    throw error;
  }
};

// 🔹 CREATE ORDER
exports.createOrder = async (order, product) => {
  try {
    const payload = {
      count_order: 1,
      product_code: product.supplierId, // ✅ dynamic
      partner_reference_id: order._id.toString(),
      end_user_ip_address: order.userIpAddress || "139.135.44.196"
    };

    // ✅ USER ID (dynamic)
    if (order.userGameId) {
      payload.user_id = order.userGameId;
    }

    // ✅ SERVER / REGION (dynamic)
    if (order.serverId) {
      payload.additional_id = order.serverId; // must match "Asia", "America", etc.
    }

    // ✅ OPTIONAL (nickname if required)
    if (order.nickname) {
      payload.additional_information = order.nickname;
    }

    console.log("📤 FINAL LAPAK PAYLOAD:", payload);

    const res = await api.post('/api/order', payload, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    console.log('📦 LAPAK RESPONSE:', res.data);

    if (res.data.code !== 'SUCCESS') {
      throw new Error(JSON.stringify(res.data));
    }

    const supplierData = res.data.data;

    order.supplierOrderId = supplierData.tid;
    order.supplierStatus = 'processing';
    order.supplierResponse = res.data;

    await order.save();

    return supplierData;

  } catch (error) {
    console.error('❌ Create Order Error:', error.response?.data || error.message);
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