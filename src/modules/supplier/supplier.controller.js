const service = require('./supplier.service');
const Product = require('../products/product.model');
const SyncLog = require('./sync-log.model');

// ============================
// SYNC PRODUCTS
// ============================
exports.syncProducts = async (req, res, next) => {
  try {
    const result = await service.syncProducts();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================
// FULL SYNC (with history save)
// ============================
exports.fullSync = async (req, res, next) => {
  try {
    const start = Date.now();

    const categoryResult = await service.syncCategories();
    const productResult = await service.syncProducts();

    const end = Date.now();

    const syncData = {
      executionTime: `${((end - start) / 1000).toFixed(2)}s`,
      categories: {
        synced: categoryResult.total || 0
      },
      products: {
        total: productResult.total || 0,
        matched: productResult.matched || 0,
        created: productResult.created || 0,
        updated: productResult.updated || 0,
        missing: productResult.missing || 0,
        missingNames: productResult.missingNames || [],
        totalSavings: productResult.totalSavings || 0
      },
      status: 'success'
    };

    // ✅ DB mein save karo
    await SyncLog.create(syncData);

    res.json({ success: true, ...syncData });

  } catch (err) {
    await SyncLog.create({ status: 'failed' }).catch(() => {});
    next(err);
  }
};

// ============================
// SYNC HISTORY
// ============================
exports.getSyncHistory = async (req, res, next) => {
  try {
    const logs = await SyncLog.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

// ============================
// CLEANUP STALE
// ============================
exports.cleanupStale = async (req, res, next) => {
  try {
    if (req.query.confirm !== 'yes') {
      const stale = await Product.find({
        isSupplierAvailable: false
      }).select('name supplierCategory price isSupplierAvailable').lean();

      return res.json({
        success: false,
        message: 'Add ?confirm=yes to URL to actually delete',
        wouldDelete: stale.length,
        preview: stale
      });
    }

    const result = await Product.deleteMany({
      isSupplierAvailable: false
    });

    res.set('Cache-Control', 'no-store');

    res.json({
      success: true,
      deleted: result.deletedCount,
      message: `Removed ${result.deletedCount} unavailable stale products`
    });

  } catch (err) {
    next(err);
  }
};

// ============================
// CHECK USER ID
// ============================
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

// ============================
// GET CATEGORIES
// ============================
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await service.fetchCategories();

    const formatted = categories.map(c => ({
      code: c.code,
      name: c.name,
      game: c.name,
      hasServer: c.servers?.length > 0,
      forms: c.forms || [],
      isActive: c.check_id === 'active'
    }));

    res.json({
      success: true,
      total: formatted.length,
      data: formatted
    });

  } catch (err) {
    next(err);
  }
};

// ============================
// SYNC CATEGORIES
// ============================
exports.syncCategories = async (req, res, next) => {
  try {
    const result = await service.syncCategories();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================
// WEBHOOK
// ============================
exports.webhook = (req, res, next) => {
  service.webhook(req, res).catch(next);
};