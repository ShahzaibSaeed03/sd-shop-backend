const router = require('express').Router();
const controller = require('./order.controller');

const { protect } = require('../auth/auth.middleware');

// Buy Now
router.post('/', protect, controller.create);

// My Orders
router.get('/my', protect, controller.getMyOrders);

module.exports = router;