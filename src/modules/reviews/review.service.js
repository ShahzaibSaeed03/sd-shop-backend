const Review = require('./review.model');
const mongoose = require('mongoose');

// ✅ CREATE REVIEW
exports.createReview = async (
  userId,
  body
) => {

  const {
    categoryId,
    rating,
    comment
  } = body;

  if (!categoryId) {
    throw new Error('Category required');
  }

  if (rating < 1 || rating > 5) {
    throw new Error(
      'Rating must be between 1 and 5'
    );
  }

  // ✅ prevent duplicate
  const exists =
    await Review.findOne({
      user: userId,
      category: categoryId
    });

  if (exists) {
    throw new Error(
      'You already reviewed this category'
    );
  }

  return await Review.create({

    user: userId,

    category: categoryId,

    rating,

    comment

  });

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

  await Review.findByIdAndDelete(
    reviewId
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