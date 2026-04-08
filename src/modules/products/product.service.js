const Product = require('./product.model');

exports.createProduct = async (data) => {
  return await Product.create(data);
};

exports.getProducts = async (query) => {
  const filter = { isActive: true };

  // 🔍 Search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // 📂 Category filter
  if (query.category) {
    filter.category = query.category;
  }

  return await Product.find(filter).sort({ createdAt: -1 });
};

exports.getProducts = async (query) => {
  const filter = { isActive: true };

  // 🔍 Search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // 📂 Category filter
  if (query.category) {
    filter.category = query.category;
  }

  // 💰 Price filter
  if (query.minPrice || query.maxPrice) {
    filter.price = {};

    if (query.minPrice) {
      filter.price.$gte = Number(query.minPrice);
    }

    if (query.maxPrice) {
      filter.price.$lte = Number(query.maxPrice);
    }
  }

  // 📄 Pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments(filter);

  return {
    total,
    page,
    limit,
    products
  };
};

exports.updateProduct = async (id, data) => {
  return await Product.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};