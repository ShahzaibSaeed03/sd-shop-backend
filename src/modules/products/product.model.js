const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,

  price: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    index: true
  },

  image: String,

  isActive: {
    type: Boolean,
    default: true
  },
  avgRating: {
  type: Number,
  default: 0
},
reviewCount: {
  type: Number,
  default: 0
}

}, { timestamps: true });

// 🔍 Text index for search (IMPORTANT)
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);