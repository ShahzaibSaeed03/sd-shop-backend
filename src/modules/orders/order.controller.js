const service = require('./order.service');

// ✅ CREATE
exports.create = async (req, res, next) => {
  try {
    console.log('📥 BODY:', req.body);
    if (!req.body.cpf || !req.body.buyerName) {
      return res.status(400).json({
        message: 'CPF and Buyer Name required'
      });
    }
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      req.ip;

    const userId = req.user?._id || null;
    // ❌ REMOVE REQUIRED EMAIL
    const email = req.user?.email || req.body.email;

    const order = await service.createOrder(
      userId,
      req.body.productId,
      req.body.code,
      email,
      {
        ...req.body,
        userIpAddress: ip,

        buyerName: req.body.buyerName, // ✅
        cpf: req.body.cpf,             // ✅
        installments: req.body.installments // ✅
      }

    );

    res.status(201).json(order);

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
// ==========================
// ✅ CALCULATE PRICE
// ==========================
exports.calculatePrice = async (req, res, next) => {
  try {
    const { amount, method = 'pix' } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount required' });
    }

    const basePrice = Number(amount);

    let feePercent = 0;
    if (method === 'card') feePercent = 5.4;
    if (method === 'pix') feePercent = 1;

    const fee = (basePrice * feePercent) / 100;
    const total = basePrice + fee;

    res.json({
      basePrice,
      fee,
      total,
      method
    });

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

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await service.getDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getMyRecentPurchases = async (req, res, next) => {
  try {
    const data = await service.getUserRecentPurchases(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};