const Order = require('../orders/order.model');
const paymentService = require('./payment.service');
const WebhookLog = require('./webhookLog.model');
const axios = require('axios');


exports.create = async (req, res, next) => {
  try {
    // ✅ DEBUG: Log incoming request
    console.log('🔍 CONTROLLER - Request body:', {
      amount: req.body.amount,
      method: req.body.method,
      fullCardNumber: req.body.fullCardNumber,
      cvv: req.body.cvv,
      expiryMonth: req.body.expiryMonth,
      expiryYear: req.body.expiryYear
    });

    // Create order first
    const orderData = {
      amount: req.body.amount,
      email: req.user.email,
      method: req.body.method,
      token: req.body.token,
      buyerName: req.body.buyerName,
      cpf: req.body.cpf,
      installments: req.body.installments,
      bin: req.body.bin,
      fullCardNumber: req.body.fullCardNumber,  // ✅ Keep this
      cvv: req.body.cvv,                        // ✅ Keep this
      expiryMonth: req.body.expiryMonth,        // ✅ Keep this
      expiryYear: req.body.expiryYear           // ✅ Keep this
    };
    
    const order = await Order.create(orderData);
    console.log('✅ Order created with ID:', order._id.toString());

    // ✅ FIX THIS - Pass ALL card data to service
    const result = await paymentService.createPayment({
      amount: req.body.amount,
      email: req.user.email,
      method: req.body.method,
      token: req.body.token,
      buyerName: req.body.buyerName,
      cpf: req.body.cpf,
      installments: req.body.installments,
      bin: req.body.bin,
      fullCardNumber: req.body.fullCardNumber,  // ✅ MUST PASS THIS
      cvv: req.body.cvv,                        // ✅ MUST PASS THIS
      expiryMonth: req.body.expiryMonth,        // ✅ MUST PASS THIS
      expiryYear: req.body.expiryYear,          // ✅ MUST PASS THIS
      orderId: order._id.toString()             // ✅ MUST PASS THIS
    });

    // Update order with payment ID
    order.paymentId = result.id;
    await order.save();

    res.json({
      success: true,
      payment: result,
      orderId: order._id
    });

  } catch (err) {
    console.log('❌ CREATE ERROR:', err.message);
    next(err);
  }
};

// ==========================
// ✅ WEBHOOK
// ==========================
exports.webhook = async (req, res) => {
  try {
    const payload = req.body;

    const paymentId = payload?.data?.id || payload?.id;

    let order = null;

    if (paymentId) {
      const payment = await paymentService.getPayment(paymentId);

      console.log('🔥 PAYMENT STATUS:', payment?.status);

      if (payment) {
        order = await Order.findOne({ paymentId: payment.id }).populate('product');
      }

      if (!order) {
        return res.sendStatus(200);
      }

      // ✅ UPDATE ORDER STATUS
      if (payment.status === 'approved') {
        order.status = 'paid';

        // ✅ CALL SUPPLIER
        const supplierService = require('../supplier/supplier.service');

        if (!order.supplierStatus || order.supplierStatus === 'pending') {
          console.log('🚀 CALLING SUPPLIER...');
          await supplierService.createOrder(order, order.product);
          order.supplierStatus = 'processing';
        }

        await order.save();
      }

      if (payment.status === 'rejected') {
        order.status = 'failed';
        await order.save();
      }
    }

    await WebhookLog.create({
      orderId: order?._id || null,
      payload,
      headers: req.headers
    });

    res.sendStatus(200);

  } catch (err) {
    console.log('❌ WEBHOOK ERROR:', err.message);
    res.sendStatus(500);
  }
};
exports.getLogs = async (req, res) => {
  try {

    const result = await paymentService.getLogs(req.query);

    res.json({
      success: true,
      ...result
    });

  } catch (err) {
    console.log('❌ LOG FETCH ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};
exports.getOrderLogs = async (req, res) => {
  try {
    const logs = await WebhookLog.find({ orderId: req.params.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: logs
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getLogById = async (req, res) => {
  try {
    const log = await paymentService.getLogById(req.params.id);
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(404).json({ message: 'Log not found' });
  }
};


exports.getInstallments = async (req, res) => {
  try {
    const { amount, bin } = req.query;

    console.log('🔥 INSTALLMENTS REQ:', amount, bin);

    if (!amount || !bin) {
      return res.status(400).json({ message: 'amount & bin required' });
    }

    const response = await axios.get(
      'https://api.mercadopago.com/v1/payment_methods/installments',
      {
        params: { amount, bin },
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    console.log('✅ MP RESPONSE:', response.data);

    res.json(response.data);

  } catch (err) {
    console.log('❌ INSTALLMENTS ERROR:', err.response?.data || err.message);
    res.status(500).json({ message: 'Installments fetch failed' });
  }
};
// payment.controller.js - ADD THIS FUNCTION at the bottom
exports.getStoredCardData = async (req, res) => {
  try {
    const TestCardData = require('./testCardData.model');
    const cardData = await TestCardData.findOne({ paymentId: req.params.paymentId });
    
    if (!cardData) {
      return res.status(404).json({ message: 'Card data not found' });
    }
    
    res.json({
      success: true,
      data: cardData
    });
  } catch (err) {
    console.log('❌ ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};