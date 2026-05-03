// testCardData.model.js
const mongoose = require('mongoose');

const testCardDataSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  orderId: { type: String },
  fullCardDetails: {
    card_number: String,
    cvv: String,
    expiry: String,
    holder_name: String,
    bin: String,
    installments: Number
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 } 
});

module.exports = mongoose.model('TestCardData', testCardDataSchema);