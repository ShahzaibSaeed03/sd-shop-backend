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

// ✅ update review
exports.updateReview = async (reviewId, userId, data) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error('Review not found');
  }

  // Only owner can update
  if (review.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to update this review');
  }

  // Update fields
  if (data.rating !== undefined) review.rating = data.rating;
  if (data.comment !== undefined) review.comment = data.comment;

  await review.save();

  // ⭐ update product rating again
  await updateProductRating(review.product);

  return review;
};


exports.deleteReview = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error('Review not found');
  }

  // only owner can delete
  if (review.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this review');
  }

  await Review.findByIdAndDelete(reviewId);

  // update product rating after delete
  await updateProductRating(review.product);
};
