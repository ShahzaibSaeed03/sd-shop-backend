const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },

  image: String,
  isActive: Boolean,
  slug: { type: String, unique: true }, // ✅ NEW

  // ✅ FIXED STRUCTURE
  forms: [
    {
      name: String,
      type: String,
      options: [
        {
          value: String,
          name: String
        }
      ]
    }
  ]

}, { timestamps: true });

module.exports =
  mongoose.models.Category ||
  mongoose.model('Category', categorySchema);