const router = require('express').Router();
const controller = require('./payment.controller');
const { protect } = require('../auth/auth.middleware');

router.post('/', protect, controller.create);
router.post('/webhook', controller.webhook);
module.exports = router;