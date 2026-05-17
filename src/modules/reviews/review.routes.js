const router = require('express').Router();

const controller =
  require('./review.controller');

const {
  protect
} = require('../auth/auth.middleware');

// ✅ CREATE
router.post(
  '/',
  protect,
  controller.create
);

// ✅ GET CATEGORY REVIEWS
router.get(
  '/category/:categoryId',
  controller.getByCategory
);

// ✅ UPDATE
router.put(
  '/:id',
  protect,
  controller.update
);

// ✅ DELETE
router.delete(
  '/:id',
  protect,
  controller.remove
);

// ✅ LIKE
router.post(
  '/:id/like',
  protect,
  controller.like
);

// ✅ DISLIKE
router.post(
  '/:id/dislike',
  protect,
  controller.dislike
);

module.exports = router;