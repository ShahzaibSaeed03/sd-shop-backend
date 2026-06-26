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

    const qty =
      product.isBundle
        ? (product.bundleQuantity || 1)
        : (Number(gameData.qty) || 1);

    let finalPrice = Number((product.price * qty).toFixed(2));
    let couponDiscount = 0;
    let appliedCouponCode = null;

    // ==========================
    // ✅ APPLY COUPON
    // ==========================
    if (code) {
      try {
        const couponResult = await influencerService.applyCode(code, finalPrice);
        couponDiscount = Number((finalPrice - couponResult.finalPrice).toFixed(2));
        finalPrice = Number(couponResult.finalPrice.toFixed(2));
        appliedCouponCode = code;

        console.log('🎟️ COUPON APPLIED:', {
          code,
          originalPrice: product.price * qty,
          discount: couponDiscount,
          afterCoupon: finalPrice
        });
      } catch (err) {
        console.log('❌ Invalid coupon ignored:', err.message);
      }
    }

    // ==========================
    // ✅ APPLY CASHBACK (coins)
    // ==========================
    let cashbackUsed = 0;
    let cashbackPointsUsed = 0;

    if (userId && gameData.useCoins && gameData.coinsUsed > 0) {
      const user = await User.findById(userId);
      const requestedPoints = Number(gameData.coinsUsed || 0);
      const availablePoints = Math.floor(user.cashbackPoints || 0);
      const usablePoints = Math.min(requestedPoints, availablePoints);

      cashbackPointsUsed = usablePoints;
      cashbackUsed = usablePoints / 100;
      finalPrice = Number(Math.max(0, finalPrice - cashbackUsed).toFixed(2));

      user.cashbackPoints -= usablePoints;
      user.totalCashbackSpent = (user.totalCashbackSpent || 0) + cashbackUsed;
      await user.save();

      console.log('💰 CASHBACK USED:', {
        usedPoints: usablePoints,
        usedBRL: cashbackUsed,
        remaining: user.cashbackPoints
      });
    }

    // ==========================
    // ✅ PAYMENT FEE
    // ==========================
    const paymentMethod = gameData.method || 'pix';
    let feePercent = 0;
    if (paymentMethod === 'card') feePercent = 5.4;
    if (paymentMethod === 'pix') feePercent = 1;

    const feeAmount = Number(((finalPrice * feePercent) / 100).toFixed(2));
    const totalAmount = Number((finalPrice + feeAmount).toFixed(2));

    // ==========================
    // ✅ CASHBACK TO EARN
    // ==========================
    const cashbackPercent = 1;
    const cashbackValue = Number(((totalAmount * cashbackPercent) / 100).toFixed(2));

    // ==========================
    // ✅ CREATE ORDER
    // ==========================
    const order = await Order.create({
      user: userId || null,
      isGuest: !userId,

      couponCode: appliedCouponCode,
      couponDiscount,

      cashbackEarned: cashbackValue,
      cashbackUsed,
      cashbackPointsUsed,

      email,
      buyerName: gameData.buyerName,
      cpf: gameData.cpf,
      installments: gameData.installments || 1,
      product: productId,

      // ✅ SNAPSHOT — survives product deletion/resync
      productName: product.name,
      game: product.categoryName || null,

      quantity: qty,

      originalPrice: Number((product.price * qty).toFixed(2)),
      price: totalAmount,
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
      original: product.price * qty,
      couponDiscount,
      cashbackUsed,
      finalPrice: totalAmount
    });

    const payment = await paymentService.createPayment({
      amount: totalAmount,
      method: paymentMethod,
      token: gameData.token,
      email,
      buyerName: gameData.buyerName,
      cpf: gameData.cpf,
      installments: gameData.installments,
      bin: gameData.bin,
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
// ✅ CALCULATE PRICE
// ==========================
exports.calculatePrice = async (productId, code, method = 'pix') => {

  const product = await Product.findById(productId);
  if (!product) {
    console.log('❌ ProductId received:', productId);
    throw new Error('Product not found');
  }

  let finalPrice = product.price;

  if (code) {
    const result = await influencerService.applyCode(code, product.price);
    finalPrice = result.finalPrice;
  }

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

    const orders = await Order.find({ user: userId })
      .populate('product')
      .sort({ createdAt: -1 });

    return orders.map(o => ({
      _id: o._id,
      title: o.productName || o.product?.name || 'Unknown Product',
      image: o.product?.image || '',
      status: o.status,
      createdAt: o.createdAt,
      quantity: o.quantity,

      originalPrice: o.originalPrice,
      paymentFee: o.paymentFee,
      totalAmount: o.totalAmount,
      price: o.price,

      couponCode: o.couponCode,
      couponDiscount: o.couponDiscount,

      cashbackEarned: o.cashbackEarned,
      cashbackUsed: o.cashbackUsed,
      cashbackPointsUsed: o.cashbackPointsUsed,

      cashbackCoins: Math.floor((o.cashbackEarned || 0) * 100),

      userGameId: o.userGameId,
      serverId: o.serverId,

      product: o.product
    }));

  } catch (err) {
    throw err;
  }
};

// ✅ ADMIN: ALL ORDERS
exports.getAllOrders = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const matchStage = {};
  if (query.status && query.status !== 'all') {
    matchStage.status = query.status;
  }

  const pipeline = [
    { $match: matchStage },

    // ✅ named 'productDoc' so it never collides with the order's own 'product' ObjectId field
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDoc'
      }
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
  ];

  // ✅ FILTER BY GAME — snapshot first, fallback to live product join (old orders)
  if (query.game && query.game !== 'all') {
    pipeline.push({
      $match: {
        $expr: {
          $eq: [
            { $ifNull: ['$game', '$productDoc.categoryName'] },
            query.game
          ]
        }
      }
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [{ $count: 'count' }]
      }
    }
  );

  const result = await Order.aggregate(pipeline);
  const orders = result[0]?.data || [];
  const total = result[0]?.totalCount?.[0]?.count || 0;

  return {
    success: true,
    data: orders.map(o => ({
      id: o._id,
      orderId: `#${o._id.toString().slice(-4)}`,
      date: o.createdAt,
      status: o.status,
      total: o.price,

      // ✅ snapshot first, live join fallback, then "Deleted Product" if both missing
      productName: o.productName || o.productDoc?.name || 'Deleted Product',
      game: o.game || o.productDoc?.categoryName || 'N/A',

      image: o.productDoc?.image || '',
      user: o.user?.email
    })),
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

// ✅ DISTINCT GAMES (combine snapshot history + live products)
exports.getDistinctGames = async () => {
  const [orderGames, productGames] = await Promise.all([
    Order.distinct('game', { game: { $ne: null } }),
    Product.distinct('categoryName', { categoryName: { $ne: null } })
  ]);

  const combined = [...new Set([...orderGames, ...productGames])].filter(Boolean);
  return combined.sort();
};

// ✅ ADMIN: UPDATE STATUS
exports.updateOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  const prevStatus = order.status;
  order.status = status;

  if (status === 'paid' && prevStatus !== 'paid' && order.user) {
    const user = await User.findById(order.user);

    const points = Math.floor((order.cashbackEarned || 0) * 100);

    user.cashbackPoints += points;
    user.totalCashbackEarned += order.cashbackEarned || 0;

    await user.save();
  }

  await WebhookLog.create({
    orderId: order._id,
    type: status === 'paid' ? 'PAYMENT_APPROVED' : 'STATUS_CHANGED',
    message: `${prevStatus} -> ${status}`,
    statusBefore: prevStatus,
    statusAfter: status
  });

  await order.save();
  return order;
};

// ✅ RECENT PURCHASES
exports.getRecentPurchases = async (limit = 10) => {

  const orders = await Order.find({ status: 'paid' })
    .populate({
      path: 'product',
      populate: { path: 'category', select: 'name image slug' }
    })
    .sort({ createdAt: -1 })
    .limit(limit);

  return orders
    .filter(o => o.product?.category)
    .map(o => ({
      _id: o.product.category._id,
      name: o.product.category.name,
      image: o.product.category.image,
      slug: o.product.category.slug,
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

exports.createPendingOrder = async (userId, productId, email, gameData) => {

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('Product not found');
  }

  const qty = Number(gameData.qty || 1);

  const subtotal = Number((product.price * qty).toFixed(2));

  let feePercent = 0;
  if ((gameData.method || 'pix') === 'pix') feePercent = 1;
  if ((gameData.method || 'pix') === 'card') feePercent = 5.4;

  const feeAmount = Number(((subtotal * feePercent) / 100).toFixed(2));
  const totalAmount = Number((subtotal + feeAmount).toFixed(2));

  const order = await Order.create({
    user: userId || null,
    isGuest: !userId,
    email,
    product: productId,

    // ✅ SNAPSHOT
    productName: product.name,
    game: product.categoryName || null,

    quantity: qty,

    originalPrice: subtotal,
    price: totalAmount,
    paymentFee: feeAmount,
    totalAmount: totalAmount,

    paymentMethod: gameData.method || 'pix',

    userGameId: gameData.user_id,
    serverId: gameData.server_id,
    zoneId: gameData.zone_id,
    nickname: gameData.nickname,

    status: 'pending_payment',
    supplierStatus: 'pending',

    buyerName: 'PENDING',
    cpf: '00000000000'
  });

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

    WebhookLog.countDocuments({ createdAt: { $gte: last15Min } })
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
      game: o.game || o.product?.name || 'Unknown',
      product: o.productName || o.product?.name || 'Unknown',
      status: o.status,
      supplierStatus: o.supplierStatus,
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

  const orders = await Order.find({ user: userId, status: 'paid' })
    .populate('product')
    .sort({ createdAt: -1 })
    .limit(limit);

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