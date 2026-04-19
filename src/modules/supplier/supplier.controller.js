// supplier.controller.js
const service = require('./supplier.service');

exports.syncProducts = async (req, res, next) => {
  try {
    const result = await service.syncProducts();
    res.json(result);
  } catch (err) {
    next(err);
  }
};
// supplier.controller.js

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
      data: formatted
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