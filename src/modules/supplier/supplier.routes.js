// supplier.routes.js
const router = require('express').Router();
const controller = require('./supplier.controller');
const { protect, isAdmin } = require('../auth/auth.middleware');

router.get('/sync-products', protect, isAdmin, controller.syncProducts);
router.post('/webhook', controller.webhook);

router.get('/categories', protect, isAdmin, controller.getCategories);
router.get('/sync-categories', protect, isAdmin, controller.syncCategories);
router.post('/check-user', controller.checkUserId);

// ✅ FIXED — GET method so it can be hit from browser/Postman easily
router.get('/cleanup-stale', protect, isAdmin, controller.cleanupStale);
router.get(
    '/full-sync',
    protect,
    isAdmin,
    controller.fullSync
);
module.exports = router;