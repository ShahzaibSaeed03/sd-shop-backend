const Product = require('./product.model');

// ✅ CREATE
exports.createProduct = async (data) => {
  return await Product.create(data);
};

// ✅ GET ALL (role-based)
exports.getProducts = async (query, user) => {
  const filter = {};

  if (user?.role !== 'admin') {
    filter.isActive = true;
  }

  const products = await Product.find(filter)
    .populate({
      path: 'category',
      match: { isActive: true }, // ✅ ONLY ACTIVE CATEGORY
      select: 'name code isActive'
    })
    .sort({ createdAt: -1 });

  // ❗ remove products with null category
  const filtered = user?.role === 'admin'
    ? products
    : products.filter(p => p.category !== null);

  return {
    success: true,
    total: filtered.length,
    data: filtered
  };
};

// ✅ GET ONE
exports.getProductById = async (id, user) => {
  const product = await Product.findById(id)
    .populate('category');

  if (!product) throw new Error('Product not found');

  // ❌ hide if category inactive
  if (
    user?.role !== 'admin' &&
    (!product.isActive || !product.category?.isActive)
  ) {
    throw new Error('Product not found');
  }

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
  const match = {};

  if (user?.role !== 'admin') {
    match.isActive = true;
  }

  if (query) {
    match.name = { $regex: query, $options: 'i' };
  }

  const result = await Product.aggregate([
    {
      $match: {
        ...(user?.role !== 'admin' && { isActive: true }),
        ...(query && { name: { $regex: query, $options: 'i' } })
      }
    },

    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },

    { $unwind: '$category' },

    {
      $match: {
        'category.isActive': true // ✅ FILTER HERE
      }
    },

    {
      $group: {
        _id: '$category._id',
        name: { $first: '$categoryName' },
        image: { $first: '$image' }
      }
    },

    { $limit: 20 }
  ]);
  return {
    success: true,
    data: result
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
      match: { isActive: true } // ✅ category must be active
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