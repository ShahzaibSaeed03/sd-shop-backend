const router = require('express').Router();
const controller = require('./influencer.controller');

const { protect, isAdmin } = require('../auth/auth.middleware');

// Admin
router.post('/', protect, isAdmin, controller.create);
router.get('/', protect, isAdmin, controller.getAll);

module.exports = router;