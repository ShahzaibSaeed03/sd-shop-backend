const Review = require('./review.model');
const Product = require('../products/product.model');
const mongoose = require('mongoose');

// ⭐ update rating
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    avgRating: stats[0]?.avgRating || 0,
    reviewCount: stats[0]?.reviewCount || 0
  });
};

// ✅ create review
exports.createReview = async (userId, data) => {
  const existing = await Review.findOne({
    user: userId,
    product: data.product
  });

  if (existing) {
    throw new Error('You already reviewed this product');
  }

  const review = await Review.create({
    ...data,
    user: userId
  });

  // ⭐ update product rating
  await updateProductRating(data.product);

  return review;
};

// ✅ get reviews
exports.getProductReviews = async (productId) => {
  return await Review.find({ product: productId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
};