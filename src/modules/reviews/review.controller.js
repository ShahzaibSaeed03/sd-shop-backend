const service = require('./review.service');

exports.create = async (req, res, next) => {
  try {
    const review = await service.createReview(req.user._id, req.body);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

exports.getByProduct = async (req, res, next) => {
  try {
    const reviews = await service.getProductReviews(req.params.productId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const review = await service.updateReview(
      req.params.id,
      req.user._id,
      req.body
    );

    res.json(review);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteReview(req.params.id, req.user._id);

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

