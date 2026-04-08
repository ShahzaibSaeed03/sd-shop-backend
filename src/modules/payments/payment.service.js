const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const paymentClient = new Payment(client);

exports.createPayment = async ({ amount, email, token, method }) => {
  const payment = await paymentClient.create({
    body: {
      transaction_amount: Number(amount),
      description: 'Game Pack Purchase',

      payment_method_id: method, // ✅ dynamic (visa, master, etc)
      token: token,              // ✅ REQUIRED
      installments: 1,

      payer: {
        email
      }
    }
  });

  return payment;
};