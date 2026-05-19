// sync-log.model.js
const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  executionTime: String,
  categories: {
    synced: Number
  },
  products: {
    total: Number,
    matched: Number,
    created: Number,
    updated: Number,
    missing: Number,
    missingNames: [String],
    totalSavings: Number
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);