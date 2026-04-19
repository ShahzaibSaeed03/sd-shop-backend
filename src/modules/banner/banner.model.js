const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({

  title: {
    type: String,
    trim: true
  },

  desktopImage: {
    type: String,
    required: true
  },

  mobileImage: {
    type: String
  },

  link: String,

  section: {
    type: String,
    enum: ['top_games', 'hot_selling', 'featured', 'new_releases'],
    required: true
  },

  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
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