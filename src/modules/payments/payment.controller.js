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

    console.log('🔥 WEBHOOK HIT');

    // ✅ SAVE LOG
    await WebhookLog.create({
      payload: req.body,
      headers: req.headers
    });

    await paymentService.handleWebhook(req.body);

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
exports.getLogById = async (req, res) => {
  try {
    const log = await paymentService.getLogById(req.params.id);
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(404).json({ message: 'Log not found' });
  }
};
