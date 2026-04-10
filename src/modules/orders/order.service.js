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
exports.getUserOrders = async (userId) => {0
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
  try {
    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    return await Order.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name price')
      .sort({ createdAt: -1 });
  } catch (err) {
    throw err;
  }
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