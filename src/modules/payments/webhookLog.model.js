const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  payload: Object,
  headers: Object
}, { timestamps: true });

// ✅ ADD INDEX
schema.index({ createdAt: -1 });
schema.index({ orderId: 1 });

module.exports = mongoose.model('WebhookLog', schema);