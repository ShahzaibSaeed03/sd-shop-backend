const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },

  // ✅ RELATION
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  displayName: {
    type: String,
    default: ''
  },
  // ✅ optional fast access
  categoryName: { type: String, index: true },

  supplierCategory: String, // category_code
  supplierId: { type: String, index: true },

  image: String,

  requiresUserId: { type: Boolean, default: true },
  requiresServer: { type: Boolean, default: false },
  requiresZone: { type: Boolean, default: false },
  requiresNickname: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true },
featured: {
  type: Boolean,
  default: false
},
  markup: {
    type: Number,
    default: 0,
    min: 0,
    max: 500
  }

}, { timestamps: true });

productSchema.virtual('finalPrice').get(function () {
  return this.price + (this.price * this.markup / 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);