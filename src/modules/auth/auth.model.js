const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
password: {
  type: String,
  required: false // ✅ FIX
},
cashbackPoints: {
  type: Number,
  default: 0
},
totalCashbackEarned: {
  type: Number,
  default: 0
},
totalCashbackSpent: {
  type: Number,
  default: 0
},
googleId: String,
provider: {
  type: String,
  default: 'local'
},
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);