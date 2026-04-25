const { MercadoPagoConfig, Payment } = require('mercadopago');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const supplierService = require('../supplier/supplier.service');
const WebhookLog = require('./webhookLog.model');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const paymentClient = new Payment(client);

// ==========================
// ✅ CREATE PAYMENT
// ==========================
exports.createPayment = async ({ amount, email, method, token }) => {

  const body = {
    transaction_amount: Number(amount),
    description: 'Game Pack Purchase',
    payer: { email },
    notification_url: `${process.env.BASE_URL}/api/payments/webhook`
  };

  // ✅ PIX
  if (method === 'pix') {
    body.payment_method_id = 'pix';
  }

  // ✅ CARD
  if (method === 'card') {
    body.payment_method_id = 'visa'; // or dynamic
    body.token = token; // 🔥 from frontend
    body.installments = 1;
  }

  const payment = await paymentClient.create({ body });

  return payment;
};

// ==========================
// ✅ HANDLE WEBHOOK
// ==========================
exports.getPayment = async (paymentId) => {
  try {
    const res = await paymentClient.get({ id: paymentId });
    return res;
  } catch (err) {
    console.log('❌ GET PAYMENT ERROR:', err.message);
    return null;
  }
};
exports.handleWebhook = async (payload) => {
  try {

    // ✅ SAVE LOG
    await WebhookLog.create({ payload });

    const paymentId = payload?.data?.id || payload?.id;
    if (!paymentId) return;

    const payment = await exports.getPayment(paymentId);
    if (!payment) return;

    const order = await Order.findOne({ paymentId: payment.id });
    if (!order) return;

    // ✅ SAVE LOG WITH ORDER ID
    await WebhookLog.create({
      orderId: order._id,
      payload,
    });
    // ✅ ONLY APPROVED
    if (payment.status !== 'approved') return;

    // avoid duplicate
    if (order.status === 'paid') return;

    const product = await Product.findById(order.product);

    // 🔥 CALL LAPAK
    const supplierRes = await supplierService.createOrder(order, product);

    // ✅ UPDATE ORDER
    order.status = 'paid';
    order.supplierStatus = 'processing';
    order.supplierTid = supplierRes.tid; // ✅ FIXED NAME
    order.supplierResponse = supplierRes;

    await order.save();

    console.log('✅ PAYMENT SUCCESS → LAPAK CALLED');

  } catch (err) {
    console.log('❌ HANDLE WEBHOOK ERROR:', err.message);
  }
};
exports.getLogs = async (query) => {

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const skip = (page - 1) * limit;

  const total = await WebhookLog.countDocuments();

  const data = await WebhookLog.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
};
exports.getLogById = async (id) => {
  return await WebhookLog.findById(id);
};