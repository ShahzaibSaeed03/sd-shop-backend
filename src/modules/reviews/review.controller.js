const service = require('./review.service');

exports.create = async (
  req,
  res,
  next
) => {

  try {

    const review =
      await service.createReview(
        req.user._id,
        req.body
      );

    res.status(201).json({
      success: true,
      data: review
    });

  } catch (err) {

    next(err);

  }

};

// ✅ CATEGORY REVIEWS
exports.getByCategory = async (
  req,
  res,
  next
) => {

  try {

    const reviews =
      await service.getCategoryReviews(
        req.params.categoryId
      );

    res.json({

      success: true,

      ...reviews

    });

  } catch (err) {

    next(err);

  }

};

exports.update = async (
  req,
  res,
  next
) => {

  try {

    const review =
      await service.updateReview(

        req.params.id,

        req.user._id,

        req.body

      );

    res.json({

      success: true,

      data: review

    });

  } catch (err) {

    next(err);

  }

};

exports.remove = async (
  req,
  res,
  next
) => {

  try {

    await service.deleteReview(

      req.params.id,

      req.user._id

    );

    res.json({

      success: true,

      message:
        'Review deleted successfully'

    });

  } catch (err) {

    next(err);

  }

};

// ✅ LIKE
exports.like = async (
  req,
  res,
  next
) => {

  try {

    const data =
      await service.likeReview(

        req.params.id,

        req.user._id

      );

    res.json({

      success: true,

      ...data

    });

  } catch (err) {

    next(err);

  }

};

// ✅ DISLIKE
exports.dislike = async (
  req,
  res,
  next
) => {

  try {

    const data =
      await service.dislikeReview(

        req.params.id,

        req.user._id

      );

    res.json({

      success: true,

      ...data

    });

  } catch (err) {

    next(err);

  }

};