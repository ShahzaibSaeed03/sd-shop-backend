const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  isActive: { type: Boolean, default: true },

  mode: {
    type: String,
    enum: ['manual', 'api'],
    default: 'api'
  },

  // 🔵 Manual mode (store product IDs)
 categories: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category'
}],

  // 🟢 API mode (predefined sources)
  apiSource: {
    type: String,
    enum: ['top_games', 'hot_selling', 'featured', 'new_releases', null],
    default: null
  },

  order: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);