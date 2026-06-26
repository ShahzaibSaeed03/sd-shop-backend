const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  // ===========================
  // USER (logged-in or guest)
  // ===========================
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  email: {
    type: String
  },

  // ===========================
  // PRODUCT
  // ===========================
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // ✅ DENORMALIZED SNAPSHOT — taken at order creation time
  // so order history survives even if product is deleted/resynced later
  productName: {
    type: String,
    default: null
  },
  game: {
    type: String,
    default: null
  },

  quantity: {
    type: Number,
    default: 1
  },

  // ===========================
  // PRICING (full breakdown)
  // ===========================
  originalPrice: { type: Number },
  price: { type: Number, required: true },
  paymentFee: { type: Number, default: 0 },
  totalAmount: { type: Number },

  // ===========================
  // COUPON (backend-applied)
  // ===========================
  couponCode: { type: String, default: null },
  couponDiscount: { type: Number, default: 0 },

  // ===========================
  // CASHBACK / SD COINS
  // ===========================
  cashbackEarned: { type: Number, default: 0 },
  cashbackUsed: { type: Number, default: 0 },
  cashbackPointsUsed: { type: Number, default: 0 },

  // ===========================
  // INFLUENCER (optional)
  // ===========================
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Influencer'
  },

  // ===========================
  // GAME DATA
  // ===========================
  userGameId: String,
  serverId: String,
  zoneId: String,
  nickname: String,

  // ===========================
  // PAYMENT
  // ===========================
  paymentMethod: {
    type: String,
    enum: ['card', 'pix'],
    default: 'pix'
  },
  paymentId: String,
  installments: { type: Number, default: 1 },
  buyerName: { type: String, required: true },
  cpf: { type: String, required: true },
  userIpAddress: String,

  // ===========================
  // SUPPLIER (Lapak)
  // ===========================
  supplierTid: String,
  supplierResponse: Object,
  supplierStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },

  // ===========================
  // ORDER STATUS
  // ===========================
  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending_payment'
  }

}, { timestamps: true });

// ===========================
// INDEXES
// ===========================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ couponCode: 1 });
orderSchema.index({ paymentId: 1 });

module.exports = mongoose.model('Order', orderSchema);