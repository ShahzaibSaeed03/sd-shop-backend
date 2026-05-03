const router = require('express').Router();
const controller = require('./payment.controller');
const { protect } = require('../auth/auth.middleware');

// ==========================
// CREATE PAYMENT
// ==========================
router.post('/create', controller.create);
router.get('/installments', controller.getInstallments);
// ==========================
// WEBHOOK (PUBLIC)
// ==========================
router.post('/webhook', controller.webhook);
router.get('/logs', controller.getLogs);
router.get('/logs/:id', controller.getLogById);
router.get('/order/:id', protect, controller.getOrderLogs);

module.exports = router;