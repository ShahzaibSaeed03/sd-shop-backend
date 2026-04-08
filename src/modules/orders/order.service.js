const Order = require('./order.model'); // ✅ ADD THIS
const Product = require('../products/product.model');
const influencerService = require('../influencer/influencer.service');
const invoiceService = require('../invoice/invoice.service');
const paymentService = require('../payments/payment.service');

exports.createOrder = async (userId, productId, code, email) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found');

  let finalPrice = product.price;
  let influencer = null;
  let discountAmount = 0;

  // ✅ APPLY PROMO
  if (code) {
    const result = await influencerService.applyCode(code, product.price);

    finalPrice = result.finalPrice;
    discountAmount = result.discountAmount;
    influencer = result.influencer._id;
  }

  // ✅ CREATE PAYMENT FIRST
 const payment = await paymentService.createPayment({
  amount: finalPrice,
  method: 'pix',
  email: 'test_user_3000691763805157998@testuser.com'
});

  // ✅ CREATE ORDER WITH PAYMENT ID
  const order = await Order.create({
    user: userId,
    product: productId,
    price: finalPrice,
    originalPrice: product.price,
    discount: discountAmount,
    influencer: influencer,
    paymentId: payment.id, // ✅ NOW CORRECT
    status: 'pending'
  });

  await invoiceService.createInvoice(order);

  return {
    order,
    payment // return QR etc
  };
};