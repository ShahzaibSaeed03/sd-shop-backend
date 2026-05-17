const mongoose = require('mongoose');

const bundleProductSchema =
  new mongoose.Schema({

    // =========================
    // BASIC
    // =========================

    name: {
      type: String,
      required: true
    },

    image: {
      type: String,
      default: ''
    },

    description: {
      type: String,
      default: ''
    },

    rules: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },

    badge: {
      type: String,
      default: ''
    },

    // =========================
    // CATEGORY
    // =========================

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },

    // =========================
    // BASE PRODUCT
    // =========================

    baseProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    // =========================
    // QUANTITY
    // =========================

    quantity: {
      type: Number,
      default: 1,
      min: 1
    },

    // =========================
    // PRICE
    // =========================

    customPrice: {
      type: Number,
      default: 0
    },

    // =========================
    // ACTIVE
    // =========================

    isActive: {
      type: Boolean,
      default: true
    }

  }, {
    timestamps: true
  });

module.exports = mongoose.model(
  'BundleProduct',
  bundleProductSchema
);