const router = require('express').Router();
const controller = require('./category.controller');
const multer = require('multer');
const { protect, isAdmin } = require('../auth/auth.middleware');
const optionalAuth = require('../../middlewares/optionalAuth');


// 🔥 FIX
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage
});

// ✅ GET ALL
router.get('/',  controller.getCategories);

// ✅ SEARCH
router.get(
  '/search',
  optionalAuth,
  controller.searchCategories
);// ✅ UPDATE
router.put(
  '/:id',
  protect,
  isAdmin,
  upload.single('image'),
  controller.updateCategory
);

module.exports = router;