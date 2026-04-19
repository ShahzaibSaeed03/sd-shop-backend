const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  payload: Object,
  headers: Object
}, { timestamps: true });

module.exports = mongoose.model('WebhookLog', schema);