const Review = require('./review.model');
const mongoose = require('mongoose');
const Category = require('../categorey/category.model');

// ✅ CREATE REVIEW
exports.createReview = async (userId, body) => {

  const { categoryId, rating, comment } = body;

  if (!categoryId) {
    throw new Error('Category required');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // ✅ duplicate check hatao — multiple reviews allow
  // const exists = await Review.findOne({ user: userId, category: categoryId });
  // if (exists) { throw new Error('You already reviewed this category'); }

  const review = await Review.create({
    user: userId,
    category: categoryId,
    rating,
    comment
  });

  await updateCategoryRating(categoryId);

  return review;

};

// ✅ GET CATEGORY REVIEWS
exports.getCategoryReviews = async (
  categoryId
) => {

  const reviews = await Review.find({

    category: categoryId

  })

    .populate(
      'user',
      'name avatar picture'
    )

    .sort({
      createdAt: -1
    });

  const totalReviews =
    reviews.length;

  const averageRating =
    totalReviews === 0
      ? 0
      : reviews.reduce(
        (acc, r) =>
          acc + r.rating,
        0
      ) / totalReviews;

  return {

    averageRating: Number(
      averageRating.toFixed(1)
    ),

    totalReviews,

    reviews: reviews.map(r => ({

      _id: r._id,

      user: r.user,

      rating: r.rating,

      comment: r.comment,

      createdAt: r.createdAt,

      likesCount:
        r.likes.length,

      dislikesCount:
        r.dislikes.length,

      liked: false,

      disliked: false

    }))

  };

};
const updateCategoryRating = async (categoryId) => {

  const stats = await Review.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId)
      }
    },
    {
      $group: {
        _id: '$category',

        averageRating: {
          $avg: '$rating'
        },

        totalReviews: {
          $sum: 1
        }
      }
    }
  ]);

  await Category.findByIdAndUpdate(
    categoryId,
    {
      averageRating:
        Number(
          (stats[0]?.averageRating || 0)
            .toFixed(1)
        ),

      totalReviews:
        stats[0]?.totalReviews || 0
    }
  );

};
// ✅ UPDATE REVIEW
exports.updateReview = async (
  id,
  userId,
  body
) => {

  const review =
    await Review.findById(id);

  if (!review) {
    throw new Error(
      'Review not found'
    );
  }

  if (
    review.user.toString() !==
    userId.toString()
  ) {
    throw new Error(
      'Not authorized'
    );
  }

  review.rating =
    body.rating ??
    review.rating;

  review.comment =
    body.comment ??
    review.comment;

  await review.save();
  await updateCategoryRating(
    review.category
  );

  return review;

}; 

// ✅ DELETE 
exports.deleteReview = async (
  reviewId,
  userId
) => {

  const review =
    await Review.findById(
      reviewId
    );

  if (!review) {
    throw new Error(
      'Review not found'
    );
  }

  if (
    review.user.toString() !==
    userId.toString()
  ) {
    throw new Error(
      'Not authorized'
    );
  }

  // ✅ category save
  const categoryId =
    review.category;

  // ✅ delete review
  await Review.findByIdAndDelete(
    reviewId
  );

  // ✅ refresh rating
  await updateCategoryRating(
    categoryId
  );

};

// ✅ LIKE REVIEW
exports.likeReview = async (
  reviewId,
  userId
) => {

  const review =
    await Review.findById(
      reviewId
    );

  if (!review) {
    throw new Error(
      'Review not found'
    );
  }

  // remove dislike
  review.dislikes =
    review.dislikes.filter(
      x =>
        x.toString() !==
        userId.toString()
    );

  // toggle like
  const alreadyLiked =
    review.likes.some(
      x =>
        x.toString() ===
        userId.toString()
    );

  if (alreadyLiked) {

    review.likes =
      review.likes.filter(
        x =>
          x.toString() !==
          userId.toString()
      );

  } else {

    review.likes.push(userId);

  }

  await review.save();

  return {
    likesCount:
      review.likes.length,
    dislikesCount:
      review.dislikes.length
  };

};

// ✅ DISLIKE REVIEW
exports.dislikeReview = async (
  reviewId,
  userId
) => {

  const review =
    await Review.findById(
      reviewId
    );

  if (!review) {
    throw new Error(
      'Review not found'
    );
  }

  // remove like
  review.likes =
    review.likes.filter(
      x =>
        x.toString() !==
        userId.toString()
    );

  // toggle dislike
  const alreadyDisliked =
    review.dislikes.some(
      x =>
        x.toString() ===
        userId.toString()
    );

  if (alreadyDisliked) {

    review.dislikes =
      review.dislikes.filter(
        x =>
          x.toString() !==
          userId.toString()
      );

  } else {

    review.dislikes.push(userId);

  }

  await review.save();

  return {

    likesCount:
      review.likes.length,

    dislikesCount:
      review.dislikes.length

  };

};