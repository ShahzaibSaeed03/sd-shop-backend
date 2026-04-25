const mongoose = require('mongoose');

// Define the sub-schemas first
const optionSchema = new mongoose.Schema({
  value: { type: String },
  name: { type: String }
}, { _id: false });

const formFieldSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String },
  options: [optionSchema]
}, { _id: false });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  slug: { type: String, unique: true },
  game: { type: String },
  forms: [formFieldSchema]
}, { timestamps: true });

// Clear the model cache completely
if (mongoose.models.Category) {
  delete mongoose.models.Category;
}
if (mongoose.modelSchemas && mongoose.modelSchemas.Category) {
  delete mongoose.modelSchemas.Category;
}

module.exports = mongoose.model('Category', categorySchema);