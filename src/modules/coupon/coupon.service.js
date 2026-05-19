const Coupon = require('./coupon.model');
const Product = require('../products/product.model');

// ============================
// APPLY COUPON
// ============================
exports.applyCoupon = async ({ code, cartProducts, totalAmount }) => {

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true
  });

  if (!coupon) throw new Error('Invalid coupon');

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error('Coupon expired');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('Coupon limit reached');
  }

  if (totalAmount < coupon.minOrderAmount) {
    throw new Error(`Minimum order must be ${coupon.minOrderAmount}`);
  }

  const productIds = cartProducts.map(p => p._id);

  const products = await Product.find({
    _id: { $in: productIds }
  }).populate('category');

  let applicableProducts = [];

  const hasProducts = coupon.products && coupon.products.length > 0;
  const hasCategories = coupon.categories && coupon.categories.length > 0;

  if (!hasProducts && !hasCategories) {
    applicableProducts = products;
  } else {
    const allowedProductIds = coupon.products.map(p => p.toString());
    const allowedCategoryIds = coupon.categories.map(c => c.toString());

    applicableProducts = products.filter(product => {
      const productMatched = allowedProductIds.includes(product._id.toString());
      const categoryMatched = allowedCategoryIds.includes(product.category?._id.toString());
      return productMatched || categoryMatched;
    });
  }

  applicableProducts = applicableProducts.filter(p => p.allowCoupon !== false);

  if (applicableProducts.length === 0) {
    throw new Error('Coupon not applicable to selected products');
  }

  const applicableAmount = applicableProducts.reduce((sum, p) => sum + p.price, 0);

  let discount = 0;

  if (coupon.type === 'percentage') {
    discount = (applicableAmount * coupon.value) / 100;
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(discount, totalAmount);

  return {
    success: true,
    discount,
    finalAmount: totalAmount - discount,
    appliedOn: applicableAmount,
    coupon: coupon.code,
    applicableProducts
  };
};

// ============================
// CREATE COUPON
// ============================
exports.createCoupon = async (data) => {

  const {
    code,
    type,
    value,
    products,
    categories,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    expiresAt,
    avatar,
    affiliateName,
    affiliateSlug,
    applyMode
  } = data;

  const exists = await Coupon.findOne({ code });
  if (exists) throw new Error('Coupon already exists');

  if (!code || !type || !value) throw new Error('Required fields missing');

  if (!['percentage', 'fixed'].includes(type)) throw new Error('Invalid coupon type');

  // ✅ Partner link generate
  const generatedLink = affiliateSlug
    ? `https://home.sdshop.gg/product/${affiliateSlug}/${code.toUpperCase()}`
    : null;

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    type,
    value,
    applyMode: applyMode || 'global',
    products: products || [],
    categories: categories || [],
    minOrderAmount: minOrderAmount || 0,
    maxDiscount,
    usageLimit,
    expiresAt,
    avatar,
    affiliateName,
    affiliateSlug,
    generatedLink
  });

  // ============================
  // APPLY AFFILIATE TO PRODUCTS
  // ============================
  if (affiliateName || affiliateSlug || avatar) {

    const affiliateData = {
      name: affiliateName || '',
      slug: affiliateSlug || '',
      image: avatar || '',
      couponCode: coupon.code
    };

    const hasProducts = products && products.length > 0;
    const hasCategories = categories && categories.length > 0;

    if (hasProducts) {
      await Product.updateMany(
        { _id: { $in: products } },
        { $set: { affiliate: affiliateData } }
      );
    }

    if (hasCategories) {
      await Product.updateMany(
        { category: { $in: categories } },
        { $set: { affiliate: affiliateData } }
      );
    }

    if (!hasProducts && !hasCategories) {
      await Product.updateMany(
        {},
        { $set: { affiliate: affiliateData } }
      );
    }
  }

  return coupon;
};

// ============================
// UPDATE COUPON
// ============================
exports.updateCoupon = async (id, data) => {

  // ✅ Link regenerate karo agar slug ya code update ho
  if (data.affiliateSlug || data.code) {
    const existing = await Coupon.findById(id);
    const slug = data.affiliateSlug || existing?.affiliateSlug;
    const code = data.code || existing?.code;

    if (slug && code) {
      data.generatedLink = `https://home.sdshop.gg/product/${slug}/${code.toUpperCase()}`;
    }
  }

  const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });

  if (!coupon) throw new Error('Coupon not found');

  return coupon;
};

// ============================
// DELETE
// ============================
exports.deleteCoupon = async (id) => {

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) throw new Error('Coupon not found');

  return true;
};

// ============================
// GET ALL
// ============================
exports.getCoupons = async (query) => {

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  let filter = {};

  if (query.status === 'active') filter.isActive = true;
  if (query.status === 'disabled') filter.isActive = false;

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

// ============================
// GET ONE
// ============================
exports.getCouponById = async (id) => {

  const coupon = await Coupon.findById(id);

  if (!coupon) throw new Error('Coupon not found');

  return coupon;
};