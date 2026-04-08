const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,

  image: {
    type: String,
    required: true
  },

  link: String,

  type: {
    type: String,
    enum: ['home', 'promo', 'featured'],
    default: 'home'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  order: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);