const router = require('express').Router();
const controller = require('./review.controller');

const { protect } = require('../auth/auth.middleware');

// Create review (logged-in users)
router.post('/', protect, controller.create);

// Get reviews by product
router.get('/product/:productId', controller.getByProduct);

module.exports = router;