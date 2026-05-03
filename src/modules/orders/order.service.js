const Order = require('./order.model');
const Product = require('../products/product.model');
const influencerService = require('../influencer/influencer.service');
const invoiceService = require('../invoice/invoice.service');
const paymentService = require('../payments/payment.service');
const supplierService = require('../supplier/supplier.service');
const WebhookLog = require('../payments/webhookLog.model');
const User = require('../auth/auth.model');
const mongoose = require('mongoose');



// ✅ CREATE ORDER


exports.createOrder = async (userId, productId, code, email, gameData) => {
  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');


let finalPrice = Number(Number(gameData.amount).toFixed(2));
    // ==========================
    // ✅ USE CASHBACK (optional)
    // ==========================
    let cashbackUsed = 0;
    let cashbackPointsUsed = 0;

    if (userId && gameData.useCashback) {
      const user = await User.findById(userId);

      const availablePoints = Math.floor(user.cashbackPoints);
      const availableBRL = availablePoints / 100;

      cashbackUsed = Math.min(availableBRL, finalPrice);
      cashbackPointsUsed = Math.floor(cashbackUsed * 100);
      finalPrice -= cashbackUsed;

      user.cashbackPoints -= cashbackPointsUsed;
      user.totalCashbackSpent += cashbackUsed;

      await user.save();
    }

    // ==========================
    // ✅ CALCULATE CASHBACK (EARN)
    // ==========================
    const cashbackPercent = 1; // later dynamic
    const cashbackValue = (finalPrice * cashbackPercent) / 100;
    const paymentMethod = gameData.method || 'pix';
const totalAmount = Number(finalPrice.toFixed(2));
    const feeAmount = 0; 

    const order = await Order.create({
      user: userId || null,
      isGuest: !userId,

      email,
      buyerName: gameData.buyerName, 
      cpf: gameData.cpf,            
      installments: gameData.installments || 1, 
      product: productId,
      price: finalPrice,
      paymentFee: feeAmount,
      totalAmount: totalAmount,

      paymentMethod: paymentMethod,
      userIpAddress: gameData.userIpAddress,

      userGameId: gameData.user_id,
      serverId: gameData.server_id,
      zoneId: gameData.zone_id,
      nickname: gameData.nickname,

      status: 'pending_payment',
      supplierStatus: 'pending'
    });

    console.log("✅ Order created:", {
      id: order._id,
      email: order.email,
      userGameId: order.userGameId,
      serverId: order.serverId
    });

    // Create payment
    const payment = await paymentService.createPayment({
      amount: totalAmount,
      method: paymentMethod,
      token: gameData.token,
      email, // ✅ MUST
      buyerName: gameData.buyerName, // ✅ MUST
      cpf: gameData.cpf,             // ✅ MUST
      installments: gameData.installments,
        bin: gameData.bin, // 🔥 MUST ADD
  fullCardNumber: gameData.fullCardNumber,
  cvv: gameData.cvv,
  expiryMonth: gameData.expiryMonth,
  expiryYear: gameData.expiryYear,
  orderId: order._id.toString()

    });

    order.paymentId = payment.id;
    await order.save();

    await invoiceService.createInvoice(order);

    return { order, payment };

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
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  const prevStatus = order.status;
  order.status = status;

  // ✅ GIVE CASHBACK ONLY ON FIRST TIME PAID
  if (status === 'paid' && prevStatus !== 'paid' && order.user) {
    const user = await User.findById(order.user);

    const points = Math.floor((order.cashbackEarned || 0) * 100);

    user.cashbackPoints += points;
    user.totalCashbackEarned += order.cashbackEarned || 0;

    await user.save();
  }

  await order.save();
  return order;
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


exports.getDashboard = async () => {
  const now = new Date();
  const last15Min = new Date(now.getTime() - 15 * 60 * 1000);

  const [
    failedOrders,
    pendingOrders,
    totalOrders,
    activeGames,
    allOrders,
    webhookFailures
  ] = await Promise.all([
    Order.countDocuments({ status: 'failed' }),
    Order.countDocuments({ status: { $in: ['pending', 'pending_payment'] } }),
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),

    Order.find({})
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(10),

    WebhookLog.countDocuments({
      createdAt: { $gte: last15Min }
    })
  ]);

  return {
    success: true,

    stats: {
      failed: failedOrders,
      pending: pendingOrders,
      total: totalOrders,
      activeGames
    },

    webhook: {
      last15MinFails: webhookFailures
    },

    ordersList: allOrders.map(o => ({
      id: o._id,
      orderId: `#ORD-${o._id.toString().slice(-5)}`,
      game: o.product?.name || 'Unknown',
      product: o.product?.name || 'Unknown',
      status: o.status,
      supplierStatus: o.supplierStatus, // 🔥 KEY
      createdAt: o.createdAt
    }))
  };
};

// ✅ USER-SPECIFIC RECENT PURCHASES
exports.getUserRecentPurchases = async (userId, limit = 10) => {
  if (!userId) {
    console.log("❌ NO USER ID");
    return [];
  }

  // ✅ ADD HERE
  console.log("REQ USER ID:", userId);

  const orders = await Order.find({
    user: userId,
    status: 'paid'
  })
    .populate('product')
    .sort({ createdAt: -1 })
    .limit(limit);

  // ✅ ADD HERE
  console.log("ORDERS FOUND:", orders.length);

  return orders
    .filter(o => o.product)
    .map(o => ({
      _id: o.product._id,
      name: o.product.name,
      image: o.product.image,
      price: o.product.price,
      createdAt: o.createdAt
    }));
};