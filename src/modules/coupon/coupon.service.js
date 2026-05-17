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

  if (!coupon) {
    throw new Error('Invalid coupon');
  }

  // ✅ Expiry
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new Error('Coupon expired');
  }

  // ✅ Usage Limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('Coupon limit reached');
  }

  // ✅ Minimum Order
  if (totalAmount < coupon.minOrderAmount) {
    throw new Error(`Minimum order must be ${coupon.minOrderAmount}`);
  }

  const productIds = cartProducts.map(p => p._id);

  const products = await Product.find({
    _id: { $in: productIds }
  }).populate('category');

  let applicableProducts = [];

  // =====================================
  // ✅ GLOBAL COUPON
  // =====================================

  const hasProducts =
    coupon.products &&
    coupon.products.length > 0;

  const hasCategories =
    coupon.categories &&
    coupon.categories.length > 0;

  // no product/category assigned
  if (!hasProducts && !hasCategories) {
    applicableProducts = products;
  }

  // =====================================
  // ✅ SPECIFIC PRODUCTS
  // =====================================

  else {

    const allowedProductIds = coupon.products.map(
      p => p.toString()
    );

    const allowedCategoryIds = coupon.categories.map(
      c => c.toString()
    );

    applicableProducts = products.filter(product => {

      // ✅ Product match
      const productMatched =
        allowedProductIds.includes(
          product._id.toString()
        );

      // ✅ Category match
      const categoryMatched =
        allowedCategoryIds.includes(
          product.category?._id.toString()
        );

      return productMatched || categoryMatched;
    });
  }

  // =====================================
  // ✅ PRODUCT allowCoupon CHECK
  // =====================================

  applicableProducts = applicableProducts.filter(
    p => p.allowCoupon !== false
  );

  if (applicableProducts.length === 0) {
    throw new Error(
      'Coupon not applicable to selected products'
    );
  }

  // =====================================
  // ✅ CALCULATE DISCOUNT
  // =====================================

  const applicableAmount = applicableProducts.reduce(
    (sum, p) => sum + p.price,
    0
  );

  let discount = 0;

  // percentage
  if (coupon.type === 'percentage') {
    discount =
      (applicableAmount * coupon.value) / 100;
  }

  // fixed
  else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  // max discount
  if (coupon.maxDiscount) {
    discount = Math.min(
      discount,
      coupon.maxDiscount
    );
  }

  // prevent over-discount
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
    affiliateSlug
  } = data;

  // ✅ Duplicate
  const exists = await Coupon.findOne({ code });

  if (exists) {
    throw new Error('Coupon already exists');
  }

  // ✅ Required
  if (!code || !type || !value) {
    throw new Error('Required fields missing');
  }

  // ✅ Type validation
  if (!['percentage', 'fixed'].includes(type)) {
    throw new Error('Invalid coupon type');
  }

 



  // ============================
  // ✅ CREATE
  // ============================

 const coupon = await Coupon.create({
  code: code.toUpperCase(),
  type,
  value,

  products: products || [],
  categories: categories || [],

  minOrderAmount: minOrderAmount || 0,
  maxDiscount,
  usageLimit,
  expiresAt,

  avatar,

  affiliateName,
  affiliateSlug
});

  // ============================
  // ✅ APPLY AFFILIATE TO PRODUCTS
  // ============================

  if (affiliateName || affiliateSlug || avatar) {

    const affiliateData = {
      name: affiliateName || '',
      slug: affiliateSlug || '',
      image: avatar || '',
      couponCode: coupon.code
    };

 const hasProducts =
  products && products.length > 0;

const hasCategories =
  categories && categories.length > 0;

// ✅ PRODUCTS
if (hasProducts) {

  await Product.updateMany(
    {
      _id: { $in: products }
    },
    {
      $set: {
        affiliate: affiliateData
      }
    }
  );
}

// ✅ CATEGORIES
if (hasCategories) {

  await Product.updateMany(
    {
      category: { $in: categories }
    },
    {
      $set: {
        affiliate: affiliateData
      }
    }
  );
}

// ✅ GLOBAL
if (!hasProducts && !hasCategories) {

  await Product.updateMany(
    {},
    {
      $set: {
        affiliate: affiliateData
      }
    }
  );
}

  
  }

  return coupon;
};

// ============================
// UPDATE
// ============================

exports.updateCoupon = async (id, data) => {

  const coupon = await Coupon.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );

  if (!coupon) {
    throw new Error('Coupon not found');
  }

  return coupon;
};

// ============================
// DELETE
// ============================

exports.deleteCoupon = async (id) => {

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    throw new Error('Coupon not found');
  }

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

// ============================
// GET ONE
// ============================

exports.getCouponById = async (id) => {

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new Error('Coupon not found');
  }

  return coupon;
};