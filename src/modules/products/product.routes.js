const router = require('express').Router();
const controller = require('./product.controller');
const upload = require('../../middlewares/upload.middleware');

const { protect, isAdmin } = require('../auth/auth.middleware');

// 🔓 Public Routes (with filters via query)
router.get('/', controller.getAll);        // search, filter, pagination
router.get('/:id', controller.getOne);     // single product

// 🔐 Admin Routes

router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  controller.create
);router.put('/:id', protect, isAdmin, controller.update);
router.delete('/:id', protect, isAdmin, controller.remove);

module.exports = router;