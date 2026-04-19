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
    let influencer = null;
    let discountAmount = 0;

    // ✅ Apply influencer code
    if (code) {
      const result = await influencerService.applyCode(code, product.price);
      finalPrice = result.finalPrice;
      discountAmount = result.discountAmount;
      influencer = result.influencer._id;
    }

    // ✅ Create payment (PIX / Stripe etc)
    const payment = await paymentService.createPayment({
      amount: finalPrice,
      method: 'pix',
      email
    });

    // ✅ Create order
    const order = await Order.create({
      user: userId,
      product: productId,
      price: finalPrice,
      paymentId: payment.id,

      userGameId: gameData.gameId,
      serverId: gameData.serverId,

      status: 'pending',
      supplierStatus: 'pending'
    });
    // ✅ AFTER ORDER CREATED (CORRECT PLACE)
    if (code) {
      const Coupon = require('../coupon/coupon.model');

      await Coupon.updateOne(
        { code },
        { $inc: { usedCount: 1 } }
      );
    }
    // ✅ Create invoice
    await invoiceService.createInvoice(order);

    // ⚠️ OPTIONAL (NOT recommended for real payment flow)
    // Call supplier immediately (only if your business logic allows)
    // try {

    //   order.supplierResponse = supplierResponse;
    //   order.supplierStatus = 'processing';

    //   await order.save();
    // } catch (err) {
    //   console.log('❌ Supplier failed:', err.message);

    //   order.supplierStatus = 'failed';
    //   await order.save();
    // }

    return { order, payment };

  } catch (err) {
    console.log('❌ CREATE ORDER ERROR:', err.message);
    throw err;
  }
};

// ✅ USER ORDERS
exports.getUserOrders = async (userId) => {
  0
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