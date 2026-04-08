const router = require('express').Router();
const controller = require('./invoice.controller');

const { protect, isAdmin } = require('../auth/auth.middleware');

// Admin only
router.get('/', protect, isAdmin, controller.getAll);

module.exports = router;