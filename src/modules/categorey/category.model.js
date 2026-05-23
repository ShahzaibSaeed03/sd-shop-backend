const mongoose = require('mongoose');

// =========================
// OPTION SCHEMA
// =========================

const optionSchema = new mongoose.Schema({
  value: { type: String },
  name: { type: String }
}, { _id: false });

// =========================
// FORM FIELD SCHEMA
// =========================

const formFieldSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String },
  options: [optionSchema],
  
}, { _id: false });

// =========================
// GAME INFORMATION SCHEMA
// =========================

const contentBlockSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ''
  },

  content: {
    type: String,
    default: ''
  },

  sortOrder: {
    type: Number,
    default: 0
  }

}, { _id: true });

// =========================
// CATEGORY SCHEMA
// =========================

const categorySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  code: {
    type: String,
    unique: true,
    required: true
  },

  image: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  slug: {
    type: String,
    unique: true
  },

  game: {
    type: String
  },

  forms: [formFieldSchema],

  // ✅ NEW FIELD
  gameInformation: [contentBlockSchema],
  averageRating: {
  type: Number,
  default: 0
},

totalReviews: {
  type: Number,
  default: 0
},

}, {
  timestamps: true
});

// =========================
// CLEAR MODEL CACHE
// =========================

if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

if (
  mongoose.modelSchemas &&
  mongoose.modelSchemas.Category
) {
  delete mongoose.modelSchemas.Category;
}

// =========================
// EXPORT MODEL
// =========================

module.exports = mongoose.model(
  'Category',
  categorySchema
);