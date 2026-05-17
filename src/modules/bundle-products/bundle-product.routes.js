const router = require('express').Router();

const multer = require('multer');

const controller = require(
  './bundle-product.controller'
);

const {
  protect,
  isAdmin
} = require('../auth/auth.middleware');

const storage = multer.memoryStorage();

const upload = multer({
  storage
});

// =========================
// CREATE
// =========================

router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  controller.create
);

// =========================
// GET ALL
// =========================

router.get(
  '/',
  controller.getAll
);
router.get(
  '/category/:categoryId',
  controller.getByCategory
);
// =========================
// GET ONE
// =========================

router.get(
  '/:id',
  controller.getOne
);

// =========================
// UPDATE
// =========================

router.put(
  '/:id',
  protect,
  isAdmin,
  upload.single('image'),
  controller.update
);

// =========================
// DELETE
// =========================

router.delete(
  '/:id',
  protect,
  isAdmin,
  controller.remove
);

module.exports = router;