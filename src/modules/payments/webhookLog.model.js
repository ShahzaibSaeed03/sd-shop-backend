const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  payload: Object,
  headers: Object
}, { timestamps: true });

module.exports = mongoose.model('WebhookLog', schema);