const router = require('express').Router();
const { protect, isAdmin } = require('./auth.middleware');

const controller = require('./auth.controller');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.patch('/make-admin/:id', protect, isAdmin, controller.makeAdmin);


module.exports = router;