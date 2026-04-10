const router = require('express').Router();
const controller = require('./supplier.controller');
// 🔥 create supplier order (optional API)
router.post('/create-order', controller.createOrder);

// 🔥 webhook
router.post('/webhook', controller.webhook);

module.exports = router;