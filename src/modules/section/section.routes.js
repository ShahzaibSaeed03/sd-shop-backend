const router = require('express').Router();
const controller = require('./section.controller');
const { protect, isAdmin } = require('../auth/auth.middleware');

// ADMIN
router.post('/', protect, isAdmin, controller.create);
router.get('/', protect, isAdmin, controller.getAll);
router.put('/:id', protect, isAdmin, controller.update);
router.delete('/:id', protect, isAdmin, controller.remove);
router.put('/reorder', protect, isAdmin, controller.reorder);

// OPTIONS (dropdown)
router.get('/options', protect, controller.options);

// FRONTEND (public)
router.get('/frontend', controller.getFrontend);

module.exports = router;