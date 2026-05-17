// supplier.controller.js
const service = require('./supplier.service');
const Product = require('../products/product.model'); 
exports.syncProducts = async (req, res, next) => {
  try {
    const result = await service.syncProducts();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// supplier.controller.js

exports.cleanupStale = async (req, res, next) => {
  try {
    // Safety check — query me ?confirm=yes chahiye
    if (req.query.confirm !== 'yes') {
      // Pehle preview do — kya delete hone wala hai
      const stale = await Product.find({
        supplierCategory: { $nin: ['WUTWVS'] }
      }).select('name supplierCategory price image markup').lean();

      return res.json({
        success: false,
        message: 'Add ?confirm=yes to URL to actually delete',
        wouldDelete: stale.length,
        preview: stale.map(p => ({
          name: p.name,
          category: p.supplierCategory,
          price: p.price,
          hasImage: !!p.image,
          markup: p.markup
        }))
      });
    }

    // Actually delete
    const result = await Product.deleteMany({
      supplierCategory: { $nin: ['WUTWVS'] }
    });

    res.json({
      success: true,
      deleted: result.deletedCount,
      message: `Removed ${result.deletedCount} stale products`
    });
  } catch (err) {
    next(err);
  }
};
// supplier.controller.js
exports.checkUserId = async (req, res, next) => {
  try {
    const { categoryCode, userId, serverId, nickname } = req.body;

    if (!categoryCode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'categoryCode and userId are required'
      });
    }

    const result = await service.checkUserId({
      categoryCode,
      userId,
      serverId,
      nickname
    });

    res.json(result);

  } catch (err) {
    next(err);
  }
};
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await service.fetchCategories();

    // Optional: format response cleanly
    const formatted = categories.map(c => ({
      code: c.code,
      name: c.name,
      game: c.name, // ✅ simple fix
      hasServer: c.servers?.length > 0,
      forms: c.forms || [],
      isActive: c.check_id === 'active'
    }));

    res.json({
      success: true,
      total: formatted.length,
      data: formatted,
      
    });

  } catch (err) {
    next(err);
  }
};

exports.syncCategories = async (req, res, next) => {
  try {
    const result = await service.syncCategories();
    res.json(result);
  } catch (err) {
    next(err);
  }
};
exports.webhook = (req, res, next) => {
  service.webhook(req, res).catch(next);
};

exports.fullSync = async (req, res, next) => {
  try {

    const start = Date.now();

    // =========================
    // CATEGORY SYNC
    // =========================
    const categoryResult =
      await service.syncCategories();

    // =========================
    // PRODUCT SYNC
    // =========================
    const productResult =
      await service.syncProducts();

    const end = Date.now();

    res.json({
      success: true,

      executionTime: `${(
        (end - start) / 1000
      ).toFixed(2)}s`,

      categories: {
        synced: categoryResult.total || 0
      },

      products: {
        total: productResult.total || 0,
        matched: productResult.matched || 0,
        created: productResult.created || 0,
        updated: productResult.updated || 0,
        missing: productResult.missing || 0,
        missingNames:
          productResult.missingNames || [],
        totalSavings:
          productResult.totalSavings || 0
      }
    });

  } catch (err) {
    next(err);
  }
};