const router = require('express').Router();
const controller = require('./admin.controller');

const { protect, isAdmin } = require('../auth/auth.middleware');

// 👑 Admin Dashboard
router.get('/dashboard', protect, isAdmin, controller.getDashboard);

module.exports = router;