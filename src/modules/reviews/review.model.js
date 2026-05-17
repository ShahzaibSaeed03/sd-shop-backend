const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ✅ CATEGORY REVIEW
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  comment: {
    type: String,
    default: ''
  },

  // ✅ LIKE / DISLIKE
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]

}, {
  timestamps: true
});

// ✅ ONE REVIEW PER USER PER CATEGORY
reviewSchema.index(
  {
    user: 1,
    category: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  'Review',
  reviewSchema
);