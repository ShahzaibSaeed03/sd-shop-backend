const mongoose = require('mongoose');

const influencerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  code: {
    type: String,
    required: true,
    unique: true
  },

  discount: {
    type: Number, // percentage
    default: 0
  },

  usageCount: {
    type: Number,
    default: 0
  },

  totalRevenue: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Influencer', influencerSchema);