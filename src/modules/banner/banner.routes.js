const router = require('express').Router();
const controller = require('./banner.controller');
const upload = require('../../middlewares/upload.middleware');

const { protect, isAdmin } = require('../auth/auth.middleware');

// Public (frontend)
router.get('/', controller.getAll);

// Admin
router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'), 
  controller.create
);router.put('/:id', protect, isAdmin, controller.update);
router.delete('/:id', protect, isAdmin, controller.remove);

module.exports = router;