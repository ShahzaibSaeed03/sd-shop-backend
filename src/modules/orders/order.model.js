const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
 user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null   // ✅ allow guest
},

isGuest: {
  type: Boolean,
  default: false
},
cashbackEarned: Number,
cashbackUsed: Number,
cashbackPointsUsed: Number,
  email: {  // ✅ ADD THIS FIELD
    type: String,
    required: null
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  originalPrice: Number,
  discount: Number,

  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Influencer'
  },

  paymentId: String,

  // ✅ GAME DATA
  userGameId: String,
  serverId: String,
  zoneId: String,
  nickname: String,
  paymentMethod: String,
  paymentFee: Number,
  totalAmount: Number,
  
  // ✅ SUPPLIER
  supplierTid: String,
  supplierResponse: Object,

  supplierStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  userIpAddress: String,
  buyerName: {
  type: String,
  required: true
},

cpf: {
  type: String,
  required: true
},

installments: {
  type: Number,
  default: 1
},
  // ✅ ORDER STATUS
  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending_payment'
  }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);