const { MercadoPagoConfig, Payment } = require('mercadopago');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const supplierService = require('../supplier/supplier.service');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const paymentClient = new Payment(client);

// ✅ CREATE PAYMENT
exports.createPayment = async ({ amount, email }) => {
  const payment = await paymentClient.create({
    body: {
      transaction_amount: Number(amount),
      description: 'Game Pack Purchase',
      payment_method_id: 'pix',
      payer: { email },

      // ✅ REQUIRED
      notification_url: process.env.WEBHOOK_URL
    }
  });

  return payment;
};

// ✅ HANDLE WEBHOOK
exports.handleWebhook = async (body) => {
  const { type, data } = body;

  if (type !== 'payment') return;

  const paymentId = data.id;

  // 🔥 Get payment status from MP
  const payment = await paymentClient.get({ id: paymentId });

  const status = payment.status;

  console.log('🔔 Payment:', paymentId, status);

  const order = await Order.findOne({ paymentId });

  if (!order) {
    console.log('❌ Order not found');
    return;
  }

  // ✅ PAYMENT SUCCESS
  if (status === 'approved') {
    if (order.status !== 'paid') {
      order.status = 'paid';

      // 🔥 CALL SUPPLIER HERE (CORRECT PLACE)
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

  // ❌ FAILED
  if (status === 'rejected' || status === 'cancelled') {
    order.status = 'failed';
    await order.save();
  }
};