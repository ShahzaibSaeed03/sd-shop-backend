const service = require('./payment.service');
const mercadopago = require('mercadopago');
const Order = require('../orders/order.model');

exports.webhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // 🔥 Only handle payment events
    if (type === 'payment') {
      const paymentId = data.id;

      // 🔥 Get payment details from MP
      const payment = await mercadopago.payment.findById(paymentId);

      if (payment.body.status === 'approved') {

        // 👉 You must link payment → order
        const order = await Order.findOne({
          paymentId: paymentId
        });

        if (order) {
          order.status = 'paid';
          await order.save();
        }
      }
    }

    res.sendStatus(200);

  } catch (err) {
    console.log('WEBHOOK ERROR:', err);
    res.sendStatus(500);
  }
};
exports.create = async (req, res, next) => {
  try {
    const payment = await service.createPayment({
      amount: req.body.amount,
      email: req.user.email,
      token: req.body.token,   // ✅ ADD THIS
      method: req.body.method  // ✅ ADD THIS
    });

    res.json(payment);

  } catch (err) {
    console.log('MP ERROR:', err);
    res.status(400).json(err);
  }
};