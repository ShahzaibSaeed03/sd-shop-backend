const service = require('./order.service');

exports.create = async (req, res, next) => {
  try {
  const order = await service.createOrder(
  req.user._id,
  req.body.productId,
  req.body.code,
  req.user.email // ✅ PASS EMAIL
);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await service.getUserOrders(req.user._id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};