const Coupon = require('./coupon.model');
const Product = require('../products/product.model');

exports.applyCoupon = async ({ code, cartProducts, totalAmount }) => {

  const coupon = await Coupon.findOne({ code, isActive: true });

  if (!coupon) throw new Error('Invalid coupon');

  // ✅ Expiry check
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error('Coupon expired');
  }

  // ✅ Usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('Coupon limit reached');
  }

  // ✅ Minimum order
  if (totalAmount < coupon.minOrderAmount) {
    throw new Error(`Minimum order must be ${coupon.minOrderAmount}`);
  }

  let applicableProducts = [];

  // 🔥 Get real products from DB
  const productIds = cartProducts.map(p => p._id);

  const products = await Product.find({ _id: { $in: productIds } })
    .populate('category');

  // ============================
  // ✅ GLOBAL
  // ============================
  if (coupon.appliesTo === 'all') {
    applicableProducts = products;
  }

  // ============================
  // ✅ PRODUCT LEVEL
  // ============================
  else if (coupon.appliesTo === 'products') {
    const allowedIds = coupon.products.map(p => p.toString());

    applicableProducts = products.filter(p =>
      allowedIds.includes(p._id.toString())
    );
  }

  // ============================
  // ✅ CATEGORY LEVEL
  // ============================
  else if (coupon.appliesTo === 'games') {
    const allowedCategories = coupon.categories.map(c => c.toString());

    applicableProducts = products.filter(p =>
      allowedCategories.includes(p.category?._id.toString())
    );
  }

  // ============================
  // 🔥 FILTER allowCoupon (CLIENT REQUIREMENT)
  // ============================
  applicableProducts = applicableProducts.filter(
    p => p.allowCoupon !== false
  );

  // ❌ No applicable products
  if (applicableProducts.length === 0) {
    throw new Error('Coupon not applicable to selected products');
  }

  // ============================
  // ✅ CALCULATE AMOUNT (ONLY ONCE)
  // ============================
  const applicableAmount = applicableProducts.reduce(
    (sum, p) => sum + p.price,
    0
  );

  // ============================
  // ✅ DISCOUNT LOGIC
  // ============================
  let discount = 0;

  if (coupon.type === 'percentage') {
    discount = (applicableAmount * coupon.value) / 100;
  }

  if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  // ✅ Max discount cap
  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  // ❗ Prevent over-discount
  discount = Math.min(discount, totalAmount);

  return {
    success: true,
    discount,
    finalAmount: totalAmount - discount,
    appliedOn: applicableAmount,
    coupon: coupon.code
  };
};


exports.createCoupon = async (data) => {

  const {
    code,
    type,
    value,
    appliesTo,
    products,
    categories,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    expiresAt,
    avatar
  } = data;

  // ❌ duplicate check
  const exists = await Coupon.findOne({ code });
  if (exists) {
    throw new Error('Coupon already exists');
  }

  // ❌ validation
  if (!code || !type || !value) {
    throw new Error('Required fields missing');
  }

  if (!['percentage', 'fixed'].includes(type)) {
    throw new Error('Invalid coupon type');
  }

  if (appliesTo === 'products' && (!products || products.length === 0)) {
    throw new Error('Products required for product-based coupon');
  }

  if (appliesTo === 'games' && (!categories || categories.length === 0)) {
    throw new Error('Categories required for game-based coupon');
  }

  // ✅ create
  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    type,
    value,
    appliesTo: appliesTo || 'all',
    products: products || [],
    categories: categories || [],
    minOrderAmount: minOrderAmount || 0,
    maxDiscount,
    usageLimit,
    expiresAt,
    avatar
  });

  return coupon;
};
// UPDATE
exports.updateCoupon = async (id, data) => {

  const coupon = await Coupon.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );

  if (!coupon) throw new Error('Coupon not found');

  return coupon;
};


// DELETE
exports.deleteCoupon = async (id) => {

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) throw new Error('Coupon not found');

  return true;
};
// GET ALL
exports.getCoupons = async (query) => {

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const skip = (page - 1) * limit;

  let filter = {};

  if (query.status === 'active') {
    filter.isActive = true;
  }

  if (query.status === 'disabled') {
    filter.isActive = false;
  }

  const total = await Coupon.countDocuments(filter);

  const data = await Coupon.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    data,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
};


// GET ONE
exports.getCouponById = async (id) => {
  const coupon = await Coupon.findById(id);

  if (!coupon) throw new Error('Coupon not found');

  return coupon;
};