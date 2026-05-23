const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  mode: {
    type: String,
    enum: ['manual', 'api'],
    default: 'api'
  },

  // MANUAL
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],

  // API
  apiSource: {
    type: String,
    enum: [
      'top_games',
      'hot_selling',
      'featured',
      'new_releases',
      null
    ],
    default: null
  },

  subtitle: {
    type: String,
    default: ''
  },

  tabKey: {
    type: String,
    enum: ['topup', 'coins', 'gift', 'voucher', 'items', null],
    default: null
  },

  backgroundType: {
    type: String,
    default: 'gradient'
  },

  // ✅ SPECIAL SECTION
  isSpecial: {
    type: Boolean,
    default: false
  },

  specialTitle: {
    type: String,
    default: ''
  },

  specialSubtitle: {
    type: String,
    default: ''
  },

  order: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Section', sectionSchema);