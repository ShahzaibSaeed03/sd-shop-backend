const Product = require('./product.model');
const mongoose = require('mongoose');


// ✅ CREATE
exports.createProduct = async (data) => {
  return await Product.create(data);
};

// ✅ GET ALL (role-based)
exports.getProducts = async (query, user) => {

  const matchStage = {};

  if (user?.role !== 'admin') {
    matchStage.isActive = true;
  }

  const products = await Product.aggregate([

    { $match: matchStage },

    // ✅ CATEGORY
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },

    // ✅ REVIEWS
    {
      $lookup: {
        from: "reviews", // ⚠️ check collection name
        localField: "_id",
        foreignField: "product",
        as: "reviews"
      }
    },

    // ✅ ORDERS (for sold)
    {
      $lookup: {
        from: "orders", // ⚠️ check collection name
        localField: "_id",
        foreignField: "product",
        as: "orders"
      }
    },

    // ✅ CALCULATIONS
    {
      $addFields: {
        totalReviews: { $size: "$reviews" },
        rating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            0
          ]
        },
        sold: { $size: "$orders" }
      }
    },

    // ✅ CLEAN
    {
      $project: {
        reviews: 0,
        orders: 0
      }
    },

    { $sort: { createdAt: -1 } }

  ]);

  return {
    success: true,
    total: products.length,
    data: products
  };
};

exports.getProductById = async (id, user) => {

  const product = await Product.findById(id)
    .populate('category');

  // ✅ NOT FOUND
  if (!product) {
    return null;
  }

  // ✅ ONLY CHECK PRODUCT ACTIVE
  if (user?.role !== 'admin' && !product.isActive) {
    return null;
  }

  // ❌ REMOVE THIS (important)
  // product.category?.isActive check ❌

  return product;
};

// ✅ UPDATE
// product.service.js

exports.updateProduct = async (id, data) => {

  if (data.markup !== undefined) {
    const markup = Number(data.markup);

    if (isNaN(markup) || markup < 0 || markup > 500) {
      throw new Error('Markup must be between 0 and 500');
    }

    data.markup = markup;
  }

  // ✅ displayName allowed
  if (data.displayName !== undefined) {
    data.displayName = data.displayName.trim();
  }

  return await Product.findByIdAndUpdate(id, data, { new: true });
};

// ✅ DELETE
exports.deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};

exports.searchGames = async (query, user) => {

  const filter = {};

  // ✅ only active for normal users
  if (user?.role !== 'admin') {
    filter.isActive = true;
  }

  if (query) {
    const orConditions = [
      { name: { $regex: query, $options: 'i' } },         // name
      { supplierId: { $regex: query, $options: 'i' } }    // supplierId
    ];

    // ✅ if valid Mongo ObjectId → exact match
    if (mongoose.Types.ObjectId.isValid(query)) {
      orConditions.push({ _id: query });
    }

    filter.$or = orConditions;
  }

  const products = await Product.find(filter)
    .populate({
      path: 'category',
      match: { isActive: true },
      select: 'name'
    })
    .select('_id name image price supplierId category')
    .limit(20)
    .lean();

  const filtered = user?.role === 'admin'
    ? products
    : products.filter(p => p.category !== null);

  return {
    success: true,
    data: filtered
  };
};
exports.getProductsByCategory = async (categoryId, user) => {

  const filter = {
    category: categoryId
  };

  // ❌ hide inactive products for normal user
  if (user?.role !== 'admin') {
    filter.isActive = true;
  }

  const products = await Product.find(filter)
    .populate({
      path: 'category',
      match: { isActive: true }, // ✅ category must be active
      select: 'name code forms'
    })
    .sort({ createdAt: -1 });

  // ❗ remove products where category is inactive
  const filtered = user?.role === 'admin'
    ? products
    : products.filter(p => p.category !== null);

  return {
    success: true,
    total: filtered.length,
    data: filtered
  };
};