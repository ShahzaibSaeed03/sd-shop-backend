const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  type: {
    type: String,
    required: true
  },

  message: String,

  payload: Object,

  statusBefore: String,
  statusAfter: String

}, {
  timestamps: true
});

schema.index({ orderId: 1 });
schema.index({ createdAt: -1 });
schema.index({ type: 1 });

module.exports = mongoose.model('WebhookLog', schema);