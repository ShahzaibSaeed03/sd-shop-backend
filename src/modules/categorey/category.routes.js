const router = require('express').Router();
const controller = require('./category.controller');
const multer = require('multer');
const { protect, isAdmin } = require('../auth/auth.middleware');

// 🔥 FIX
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage
});

// ✅ GET ALL
router.get('/', protect, isAdmin, controller.getCategories);

// ✅ UPDATE
router.put(
  '/:id',
  protect,
  isAdmin,
  upload.single('image'),
  controller.updateCategory
);

module.exports = router;