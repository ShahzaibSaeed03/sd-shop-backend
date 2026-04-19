// supplier.routes.js
const router = require('express').Router();
const controller = require('./supplier.controller');
const { protect, isAdmin } = require('../auth/auth.middleware');

router.get('/sync-products', protect, isAdmin, controller.syncProducts);
router.post('/webhook', controller.webhook);
// supplier.routes.js

router.get(
  '/categories',
  protect,
  isAdmin,
  controller.getCategories
);
router.get(
  '/sync-categories',
  protect,
  isAdmin,
  controller.syncCategories
);
module.exports = router;