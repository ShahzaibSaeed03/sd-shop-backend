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
    type: String   // ❌ removed: required: null  (was incorrect anyway)
  },

  // ===========================
  // PRODUCT
  // ===========================
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },

  // ===========================
  // PRICING (full breakdown)
  // ===========================
  originalPrice: { type: Number },              // product.price × qty (before any discount)
  price: { type: Number, required: true },      // final charged amount (after all discounts)
  paymentFee: { type: Number, default: 0 },
  totalAmount: { type: Number },                // price + paymentFee

  // ===========================
  // COUPON (backend-applied)
  // ===========================
  couponCode: { type: String, default: null },
  couponDiscount: { type: Number, default: 0 },

  // ===========================
  // CASHBACK / SD COINS
  // ===========================
  cashbackEarned: { type: Number, default: 0 },        // BRL earned this order
  cashbackUsed: { type: Number, default: 0 },          // BRL discount from coins
  cashbackPointsUsed: { type: Number, default: 0 },    // raw points spent

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
// INDEXES (optional but recommended)
// ===========================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ couponCode: 1 });
orderSchema.index({ paymentId: 1 });

module.exports = mongoose.model('Order', orderSchema);