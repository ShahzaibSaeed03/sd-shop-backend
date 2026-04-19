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
// ✅ RECENT PURCHASES
exports.getRecentPurchases = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;

    const orders = await service.getRecentPurchases(limit);

    res.json(orders);
  } catch (err) {
    next(err);
  }
};
exports.retry = async (req, res, next) => {
  try {
    const order = await service.retryOrder(req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
};
exports.retryOrder = async (orderId) => {
  const order = await Order.findById(orderId).populate('product');

  if (!order) throw new Error('Order not found');

  if (order.status !== 'failed') {
    throw new Error('Only failed orders can be retried');
  }

  try {
    const supplierResponse = await supplierService.createOrder(order, order.product);

    order.supplierResponse = supplierResponse;
    order.supplierStatus = 'processing';
    order.status = 'pending';

    await order.save();

    return order;

  } catch (err) {
    order.supplierStatus = 'failed';
    await order.save();

    throw new Error('Retry failed');
  }
};
exports.getOne = async (req, res, next) => {
  try {
    const order = await service.getOrderById(req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
};