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

