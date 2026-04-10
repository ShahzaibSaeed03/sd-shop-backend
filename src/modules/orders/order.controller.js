const service = require('./order.service');

// ✅ CREATE
exports.create = async (req, res, next) => {
  try {
    const result = await service.createOrder(
      req.user._id,
      req.body.productId,
      req.body.code,
      req.user.email,
      req.body
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ✅ USER ORDERS
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await service.getUserOrders(req.user._id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ✅ ADMIN ALL ORDERS
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await service.getAllOrders(req.query);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// ✅ ADMIN UPDATE STATUS
exports.updateStatus = async (req, res, next) => {
  try {
    const order = await service.updateOrderStatus(
      req.params.id,
      req.body.status
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
};