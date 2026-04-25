const paymentService = require('./payment.service');
const WebhookLog = require('./webhookLog.model');

// ==========================
// ✅ CREATE PAYMENT
// ==========================
exports.create = async (req, res, next) => {
  try {

    const result = await paymentService.createPayment({
      amount: req.body.amount,
      email: req.user.email
    });

    res.json(result);

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

    // 🔥 get payment id
    const paymentId = payload?.data?.id || payload?.id;

    let order = null;

    if (paymentId) {
      const payment = await paymentService.getPayment(paymentId);

      if (payment) {
        order = await Order.findOne({ paymentId: payment.id });
      }
    }

    // ✅ SAVE WITH ORDER LINK
    await WebhookLog.create({
      orderId: order?._id || null,
      payload,
      headers: req.headers
    });

    await paymentService.handleWebhook(payload);

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
