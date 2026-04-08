const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'paid' // simple flow
  },
paymentId: String,
status: {
  type: String,
  enum: ['pending', 'paid'],
  default: 'pending'
}
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);