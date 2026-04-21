const Order = require('./order.model');
const Product = require('../products/product.model');
const influencerService = require('../influencer/influencer.service');
const invoiceService = require('../invoice/invoice.service');
const paymentService = require('../payments/payment.service');
const supplierService = require('../supplier/supplier.service');

// ✅ CREATE ORDER

exports.createOrder = async (userId, productId, code, email, gameData) => {
  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    let finalPrice = product.price;

    // optional: apply coupon
    if (code) {
      const result = await influencerService.applyCode(code, product.price);
      finalPrice = result.finalPrice;
    }

    const paymentMethod = gameData.method || 'pix';

    // fee logic
    let feePercent = paymentMethod === 'card' ? 5.4 : 1;
    const feeAmount = (finalPrice * feePercent) / 100;
    const totalAmount = finalPrice + feeAmount;

    // ✅ CREATE PAYMENT ONLY
    const payment = await paymentService.createPayment({
      amount: totalAmount,
      method: paymentMethod,
      token: gameData.token,
      email
    });
    await Order.findByIdAndUpdate(orderId, {
      paymentId: payment.id,
      status: 'pending_payment'
    });

    // ✅ CREATE ORDER (NO LAPAK HERE)
    const order = await Order.create({
      user: userId,
      product: productId,

      price: finalPrice,
      paymentFee: feeAmount,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,

      paymentId: payment.id,

      userGameId: gameData.user_id,
      serverId: gameData.server_id,
      zoneId: gameData.zone_id,
      nickname: gameData.nickname,

      status: 'pending_payment',   // 🔥 IMPORTANT
      supplierStatus: 'pending'
    });

    await invoiceService.createInvoice(order);

    return {
      order,
      payment
    };

  } catch (err) {
    console.log('❌ CREATE ORDER ERROR:', err.message);
    throw err;
  }
};
// ==========================
// ✅ CALCULATE PRICE (NEW)
// ==========================
exports.calculatePrice = async (productId, code, method = 'pix') => {

  const product = await Product.findById(productId);
  if (!product) {
    console.log('❌ ProductId received:', productId);
    throw new Error('Product not found');
  }

  let finalPrice = product.price;

  // coupon / influencer
  if (code) {
    const result = await influencerService.applyCode(code, product.price);
    finalPrice = result.finalPrice;
  }

  // ✅ fee logic
  let feePercent = 0;

  if (method === 'card') feePercent = 5.4;
  if (method === 'pix') feePercent = 1;

  const fee = (finalPrice * feePercent) / 100;
  const total = finalPrice + fee;

  return {
    basePrice: finalPrice,
    fee,
    total,
    method
  };
};
// ✅ USER ORDERS
exports.getUserOrders = async (userId) => {
  try {
    return await Order.find({ user: userId })
      .populate('product')
      .sort({ createdAt: -1 });
  } catch (err) {
    throw err;
  }
};

// ✅ ADMIN: ALL ORDERS
exports.getAllOrders = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name price image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Order.countDocuments(filter)
  ]);

  return {
    success: true,
    data: orders.map(o => ({
      id: o._id,
      orderId: `#${o._id.toString().slice(-4)}`,
      date: o.createdAt,
      status: o.status,
      total: o.price,

      // ✅ FIX HERE
      productName: o.product?.name || 'Unknown Product',
      image: o.product?.image || '',

      user: o.user?.email
    })),
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

// ✅ ADMIN: UPDATE STATUS
exports.updateOrderStatus = async (orderId, status) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    order.status = status;
    await order.save();

    return order;
  } catch (err) {
    throw err;
  }
};

// ✅ RECENT PURCHASES (GLOBAL / PUBLIC)
// ✅ RECENT PRODUCT PURCHASES (clean response)
exports.getRecentPurchases = async (limit = 10) => {
  const orders = await Order.find({ status: 'paid' })
    .populate('product')
    .sort({ createdAt: -1 })
    .limit(limit);

  // 👉 return only product data
  return orders.map(o => ({
    _id: o.product?._id,
    name: o.product?.name,
    image: o.product?.image,
    price: o.product?.price,
    createdAt: o.createdAt
  }));
};

exports.getOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('user', 'name email')
    .populate('product');

  if (!order) throw new Error('Order not found');

  return order;
};