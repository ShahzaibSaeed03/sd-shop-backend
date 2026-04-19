const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({

  code: { type: String, required: true, unique: true },
  avatar: {
    type: String
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  allowCoupon: {
    type: Boolean,
    default: true
  },
  value: { type: Number, required: true },

  appliesTo: {
    type: String,
    enum: ['all', 'products', 'games'],
    default: 'all'
  },

  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],

  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },

  usageLimit: { type: Number },
  usedCount: { type: Number, default: 0 },

  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);