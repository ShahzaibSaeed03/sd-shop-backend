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
exports.createPayment = async ({ amount, email }) => {

  const payment = await paymentClient.create({
    body: {
      transaction_amount: Number(amount),
      description: 'Game Pack Purchase',
      payment_method_id: 'pix',
      payer: { email },
      notification_url: process.env.WEBHOOK_URL
    }
  });

  return payment;
};

// ==========================
// ✅ HANDLE WEBHOOK
// ==========================
exports.handleWebhook = async (body) => {

  console.log('📥 Webhook Body:', JSON.stringify(body));

  if (!body?.data?.id) {
    console.log('⏭️ Invalid webhook');
    return;
  }

  const paymentId = body.data.id;

  // 🔥 Fetch real payment
  const payment = await paymentClient.get({ id: paymentId });

  console.log('💰 MP Payment:', payment);

  const status = payment.status;

  const order = await Order.findOne({ paymentId });

  if (!order) {
    console.log('❌ Order not found for paymentId:', paymentId);
    return;
  }

  console.log('📦 Order Found:', order._id);

  // ==========================
  // ✅ APPROVED
  // ==========================
  if (status === 'approved') {

    if (order.status !== 'paid') {

      order.status = 'paid';

      const product = await Product.findById(order.product);

      try {
        const supplierRes = await supplierService.createSupplierOrder(order, product);

        order.supplierResponse = supplierRes;
        order.supplierStatus = 'processing';

      } catch (err) {
        console.log('❌ Supplier failed:', err.message);
        order.supplierStatus = 'failed';
      }

      await order.save();

      console.log('✅ ORDER PAID & SUPPLIER CALLED');
    }
  }

  // ==========================
  // ❌ FAILED
  // ==========================
  if (['rejected', 'cancelled'].includes(status)) {
    order.status = 'failed';
    await order.save();
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