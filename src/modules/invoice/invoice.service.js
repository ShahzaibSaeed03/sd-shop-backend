const Invoice = require('./invoice.model');

exports.createInvoice = async (order) => {
  return await Invoice.create({
    order: order._id,
    user: order.user,
    product: order.product,
    amount: order.price
  });
};

exports.getAllInvoices = async () => {
  return await Invoice.find()
    .populate('user', 'name email')
    .populate('product', 'name')
    .sort({ createdAt: -1 });
};