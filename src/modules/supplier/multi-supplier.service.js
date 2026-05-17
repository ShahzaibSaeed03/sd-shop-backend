// services/multi-supplier.service.js
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const Product = require('../products/product.model');
const Category = require('../categorey/category.model');

// ═══════════════════════════════════════════════
// SUPPLIER CONFIGURATIONS
// ═══════════════════════════════════════════════
const SUPPLIERS = [
  {
    name: 'lapakgaming',
    baseURL: process.env.LAPAK_BASE_URL || 'https://www.lapakgaming.com',
    apiKey: process.env.LAPAK_API_KEY,
    endpoint: '/api/all-products',
    countryCode: 'br',
    currency: 'IDR',
    rate: 0.00029,  // IDR → BRL
    enabled: true,
    fetchProducts: async function() {
      const res = await axios.get(`${this.baseURL}${this.endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json'
        },
        params: { country_code: this.countryCode },
        timeout: 15000
      });
      return res.data?.data?.products || [];
    }
  },

  // ✅ Add more suppliers here as you onboard them
  // Example:
  // {
  //   name: 'smile',
  //   baseURL: 'https://api.smile.one',
  //   apiKey: process.env.SMILE_API_KEY,
  //   endpoint: '/v1/products',
  //   currency: 'USD',
  //   rate: 5.50,  // USD → BRL
  //   enabled: true,
  //   fetchProducts: async function() {
  //     const res = await axios.get(...);
  //     return res.data.items.map(item => ({
  //       code: item.product_id,    // ⚠️ Map their fields to standard format
  //       price: item.usd_price,
  //       category_code: item.game
  //     }));
  //   }
  // }
];

// ═══════════════════════════════════════════════
// FIXED PRODUCT LIST (one per game variant)
// ═══════════════════════════════════════════════
const FIXED_PRODUCTS = [
  // HSR
  { code: 'HSTRESP-S117-br', name: 'Express Supply Pass', game: 'HSR' },
  { code: 'HSTR60-S116-br', name: '60 Oneiric Shard', game: 'HSR' },
  { code: 'HSTR300-S117-br', name: '300 + 30 Oneiric Shard', game: 'HSR' },
  { code: 'HSTR980-S117-br', name: '980 + 110 Oneiric Shard', game: 'HSR' },
  { code: 'HSTR1980-S117-br', name: '1980 + 260 Oneiric Shard', game: 'HSR' },
  { code: 'HSTR3280-S116-br', name: '3280 + 600 Oneiric Shard', game: 'HSR' },
  { code: 'HSTR6480-S116-br', name: '6480 + 1600 Oneiric Shard', game: 'HSR' },

  // GI
  { code: 'GIWELKIN-S113-br', name: 'Blessing Welkin Moon', game: 'GI' },
  { code: 'GI60-S113-br', name: '60 Crystals', game: 'GI' },
  { code: 'GI330-S113-br', name: '300 + 30 Crystals', game: 'GI' },
  { code: 'GI1090-S113-br', name: '980 + 110 Crystals', game: 'GI' },
  { code: 'GI2240-S113-br', name: '1980 + 260 Crystals', game: 'GI' },
  { code: 'GI3940-S27-br', name: '3280 + 600 Crystals', game: 'GI' },
  { code: 'GI8080-S113-br', name: '6480 + 1600 Crystals', game: 'GI' },

  // ZZZ
  { code: 'ZZZPASS-S1-br', name: 'Inter-Knot Membership', game: 'ZZZ' },
  { code: 'ZZZ60-S1-br', name: '60 Monochrome', game: 'ZZZ' },
  { code: 'ZZZ300-S116-br', name: '300 + 30 Monochrome', game: 'ZZZ' },
  { code: 'ZZZ980-S117-br', name: '980 + 110 Monochrome', game: 'ZZZ' },
  { code: 'ZZZ1980-S116-br', name: '1980 + 260 Monochrome', game: 'ZZZ' },
  { code: 'ZZZ3280-S117-br', name: '3280 + 600 Monochrome', game: 'ZZZ' },
  { code: 'ZZZ6480-S116-br', name: '6480 + 1600 Monochrome', game: 'ZZZ' },

  // WW
  { code: 'WUTWVSLS1-S96A', name: 'Lunite Subscription', game: 'WW' },
  { code: 'WUTWVS60-S96A', name: '60 Lunites', game: 'WW' },
  { code: 'WUTWVS300-S96A', name: '300 Lunites', game: 'WW' },
  { code: 'WUTWVS980-S96A', name: '980 Lunites', game: 'WW' },
  { code: 'WUTWVS1980-S96A', name: '1980 Lunites', game: 'WW' },
  { code: 'WUTWVS3280-S19', name: '3280 Lunites', game: 'WW' },
  { code: 'WUTWVS6480-S19', name: '6480 Lunites', game: 'WW' }
];

// ═══════════════════════════════════════════════
// FETCH ALL PRODUCTS FROM ALL SUPPLIERS (parallel)
// ═══════════════════════════════════════════════
async function fetchAllSuppliers() {
  const enabledSuppliers = SUPPLIERS.filter(s => s.enabled && s.apiKey);

  console.log(`📡 Fetching from ${enabledSuppliers.length} supplier(s)...`);

  // Fetch from each supplier in parallel
  const results = await Promise.allSettled(
    enabledSuppliers.map(async (supplier) => {
      try {
        const products = await supplier.fetchProducts();
        console.log(`✅ ${supplier.name}: ${products.length} products`);
        return {
          supplier,
          products,
          success: true
        };
      } catch (err) {
        console.error(`❌ ${supplier.name} failed:`, err.message);
        return {
          supplier,
          products: [],
          success: false,
          error: err.message
        };
      }
    })
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(r => r.success);
}

// ═══════════════════════════════════════════════
// FIND BEST PRICE FOR A PRODUCT CODE
// ═══════════════════════════════════════════════
function findBestPrice(productCode, allSupplierData) {
  const candidates = [];

  for (const { supplier, products } of allSupplierData) {
    const found = products.find(p => p.code === productCode);
    if (!found || !found.price) continue;

    // Convert to BRL using supplier-specific rate
    const convertedBRL = found.price * supplier.rate;

    candidates.push({
      source: supplier.name,
      price: found.price,                              // raw (e.g. IDR)
      currency: supplier.currency,
      converted: convertedBRL,                         // BRL
      category_code: found.category_code,
      foundAt: new Date()
    });
  }

  if (candidates.length === 0) return null;

  // Sort by converted BRL price ASCENDING → cheapest first
  candidates.sort((a, b) => a.converted - b.converted);

  return {
    winner: candidates[0],  // 🏆 CHEAPEST supplier
    allCandidates: candidates
  };
}

// ═══════════════════════════════════════════════
// MAIN SYNC FUNCTION
// ═══════════════════════════════════════════════
exports.syncProducts = async () => {
  try {
    console.log('═══════════════════════════════════════');
    console.log('🚀 MULTI-SUPPLIER SYNC STARTED');
    console.log('═══════════════════════════════════════');

    // 1. Fetch all suppliers in parallel
    const allSupplierData = await fetchAllSuppliers();

    if (allSupplierData.length === 0) {
      throw new Error('All suppliers failed — sync aborted');
    }

    // 2. Load categories
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.code] = c; });

    // 3. For each FIXED product, find best supplier price
    const stats = {
      total: FIXED_PRODUCTS.length,
      matched: 0,
      missing: 0,
      missingCodes: [],
      savings: 0
    };

    const ops = [];

    for (const fp of FIXED_PRODUCTS) {
      const result = findBestPrice(fp.code, allSupplierData);

      if (!result) {
        stats.missing++;
        stats.missingCodes.push(fp.code);
        console.log(`❌ ${fp.code} → no supplier match`);
        continue;
      }

      stats.matched++;

      const { winner, allCandidates } = result;
      const category = categoryMap[fp.game];

      // Final BRL price (rounded up, minimum 1)
      const brlPrice = Math.max(1, Math.ceil(winner.converted));

      // Calculate savings vs most expensive supplier
      if (allCandidates.length > 1) {
        const mostExpensive = allCandidates[allCandidates.length - 1];
        const saved = mostExpensive.converted - winner.converted;
        stats.savings += saved;
      }

      console.log(
        `✅ ${fp.code} → ${winner.source} ` +
        `(${winner.price} ${winner.currency} = R$${brlPrice}) ` +
        `[checked ${allCandidates.length} supplier(s)]`
      );

      ops.push({
        updateOne: {
          filter: { supplierId: fp.code },
          update: {
            $set: {
              name: fp.name,
              displayName: fp.name,
              supplierId: fp.code,
              supplierCategory: winner.category_code || fp.game,
              supplierSource: winner.source,           // 🏆 which supplier won
              supplierPriceRaw: winner.price,           // original price
              supplierCurrency: winner.currency,
              allSupplierPrices: allCandidates,        // 🔍 full audit
              price: brlPrice,
              category: category?._id,
              categoryName: category?.name,
              isActive: true,
              lastSyncedAt: new Date()
            }
          },
          upsert: true
        }
      });
    }

    // 4. Write to DB
    if (ops.length > 0) {
      await Product.bulkWrite(ops);
    }

    console.log('═══════════════════════════════════════');
    console.log(`📊 SYNC COMPLETE`);
    console.log(`   Total products: ${stats.total}`);
    console.log(`   ✅ Matched: ${stats.matched}`);
    console.log(`   ❌ Missing: ${stats.missing}`);
    console.log(`   💰 Total savings vs worst price: R$${stats.savings.toFixed(2)}`);
    if (stats.missingCodes.length) {
      console.log(`   Missing codes:`, stats.missingCodes);
    }
    console.log('═══════════════════════════════════════');

    return {
      success: true,
      total: stats.total,
      matched: stats.matched,
      missing: stats.missing,
      missingCodes: stats.missingCodes,
      savings: stats.savings
    };

  } catch (error) {
    console.error('❌ Multi-Supplier Sync Error:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════
// HELPER: get best supplier for a specific product
// (use this when CREATING an order to know who to call)
// ═══════════════════════════════════════════════
exports.getProductSupplier = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  const supplier = SUPPLIERS.find(s => s.name === product.supplierSource);
  if (!supplier) {
    throw new Error(`Supplier '${product.supplierSource}' not configured`);
  }

  return supplier;
};

exports.SUPPLIERS = SUPPLIERS;
exports.FIXED_PRODUCTS = FIXED_PRODUCTS;