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

  originalPrice: Number,
  discount: Number,

  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Influencer'
  },

  paymentId: String,

status: {
  type: String,
  enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
  default: 'pending'
}
,
supplierResponse: {
  type: Object
},

userGameId: String,
serverId: String,
supplierResponse: Object,
supplierStatus: {
  type: String,
  enum: ['pending', 'processing', 'completed', 'failed'],
  default: 'pending'
},
supplierResponse: Object
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);