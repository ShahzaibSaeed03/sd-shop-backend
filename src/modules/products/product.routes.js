const router = require('express').Router();
const controller = require('./product.controller');
const upload = require('../../middlewares/upload.middleware');

const { protect, isAdmin } = require('../auth/auth.middleware');

/**
 * ===============================
 * PUBLIC / PROTECTED ROUTES
 * ===============================
 */
router.get('/search', protect, controller.searchGames);

// 🔐 Get all products (role-based: admin sees all, user sees only active)
router.get('/', controller.getAll);

// 🔐 Special sections (role-based filtering handled in service)
router.get('/popular', protect, controller.getPopular);
router.get('/coins', protect, controller.getCoins);
router.get('/hot', protect, controller.getHot);

// 🔐 Get single product (hide inactive for normal users)
router.get('/:id', controller.getOne);


/**
 * ===============================
 * ADMIN ROUTES
 * ===============================
 */

// ✅ Create product (with image upload)
router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  controller.create
);

// ✅ Update product (includes toggle isActive)
router.put(
  '/:id',
  protect,
  isAdmin,
  upload.single('image'), // ✅ ADD THIS
  controller.update
);

// ✅ Delete product
router.delete(
  '/:id',
  protect,
  isAdmin,
  controller.remove
);
router.put('/bulk-markup', protect, isAdmin, controller.bulkUpdateMarkup);
router.get(
  '/category/:categoryId',

  controller.getByCategory
);
module.exports = router;