const paymentService = require('./payment.service');

// ✅ CREATE PAYMENT (used internally or debug only)
exports.create = async (req, res, next) => {
  try {
    const result = await paymentService.createPayment({
      amount: req.body.amount,
      email: req.user.email // always use auth user
    });

    res.status(200).json(result);

  } catch (err) {
    console.log('❌ CREATE ERROR:', err.message);
    next(err);
  }
};

// ✅ WEBHOOK (MAIN LOGIC ENTRY)
exports.webhook = async (req, res, next) => {
  try {
    await paymentService.handleWebhook(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.log('❌ WEBHOOK ERROR:', err.message);
    res.sendStatus(500);
  }
};