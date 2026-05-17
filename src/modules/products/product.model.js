const mongoose = require('mongoose');

// product.model.js
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  displayName: { type: String, default: '' },
  categoryName: { type: String, index: true },

  supplierCategory: String,
  supplierId: { type: String, index: true },

  // ✅ NEW: track which provider won (cheapest)
  providerCode: { type: String, index: true },       // jaise 'S96A', 'S19', 'S113'
  supplierPriceRaw: { type: Number, default: 0 },    // original IDR price
  allProviders: [{                                    // 🔍 audit — saare providers ki list
    code: String,        // provider_code
    fullCode: String,    // full product code
    price: Number,       // raw IDR
    converted: Number,   // BRL
    status: String       // available / empty
  }],
  lastSyncedAt: Date,

  image: String,

  requiresUserId: { type: Boolean, default: true },
  requiresServer: { type: Boolean, default: false },
  requiresZone: { type: Boolean, default: false },
  requiresNickname: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  affiliate: {
    name: String,
    slug: String,
    image: String,
    couponCode: String
  },
  isSupplierAvailable: {
    type: Boolean,
    default: true
  },
  markup: {
    type: Number,
    default: 0,
    min: 0,
    max: 500
  },
  // ===========================
// BUNDLE / EVENT PRODUCT
// ===========================

isBundle: {
  type: Boolean,
  default: false
},

baseProduct: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Product',
  default: null
},

bundleQuantity: {
  type: Number,
  default: 1,
  min: 1
},

bundleTitle: {
  type: String,
  default: ''
},

bundleDescription: {
  type: String,
  default: ''
},

bundleRules: {
  type: String,
  default: ''
},

bundleBadge: {
  type: String,
  default: ''
},

bundleItems: [
  {
    title: String,
    quantity: Number
  }
],

popupImage: {
  type: String,
  default: ''
}
}, { timestamps: true });

productSchema.virtual('finalPrice').get(function () {
  return this.price + (this.price * this.markup / 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);