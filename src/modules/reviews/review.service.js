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
exports.createReview = async (userId, body) => {
  const { productId, rating, comment } = body;

  if (!productId) throw new Error('Product required');

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const review = await Review.create({
    user: userId,
    product: productId,
    rating,
    comment
  });

  return review;
};

// ✅ get reviews
// review.service.js


exports.getProductReviews = async (productId) => {
  const reviews = await Review.find({ product: productId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews === 0
      ? 0
      : reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

  return {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
    reviews
  };
};

// ✅ update review
exports.updateReview = async (id, userId, body) => {
  const review = await Review.findById(id);

  if (!review) throw new Error('Review not found');

  if (review.user.toString() !== userId.toString()) {
    throw new Error('Not authorized');
  }

  review.rating = body.rating ?? review.rating;
  review.comment = body.comment ?? review.comment;

  await review.save();

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
