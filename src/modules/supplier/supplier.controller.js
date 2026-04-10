const supplierService = require('./supplier.service');

exports.createOrder = async (req, res, next) => {
  try {
    const { order, product } = req.body;

    const result = await supplierService.createSupplierOrder(order, product);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.log('❌ CONTROLLER ERROR:', err.message);
    next(err);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    await supplierService.webhook(req, res);
  } catch (err) {
    console.log('❌ WEBHOOK CONTROLLER ERROR:', err.message);
    next(err);
  }
};