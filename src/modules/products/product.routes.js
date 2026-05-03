const router = require('express').Router();
const controller = require('./product.controller');
const upload = require('../../middlewares/upload.middleware');
const optionalAuth = require('../../middlewares/optionalAuth');
const { protect, isAdmin } = require('../auth/auth.middleware');

/**
 * ===============================
 * PUBLIC / OPTIONAL AUTH ROUTES
 * ===============================
 */
router.get('/search', protect, controller.searchGames);
router.get('/popular', protect, controller.getPopular);
router.get('/coins', protect, controller.getCoins);
router.get('/hot', protect, controller.getHot);
router.get('/category/:categoryId', optionalAuth, controller.getByCategory);
router.get('/', optionalAuth, controller.getAll);
router.get('/:id', optionalAuth, controller.getOne);

/**
 * ===============================
 * ADMIN ROUTES
 * ===============================
 */
router.post('/', protect, isAdmin, upload.single('image'), controller.create);
router.put('/bulk-markup', protect, isAdmin, controller.bulkUpdateMarkup);
router.put('/:id', protect, isAdmin, upload.single('image'), controller.update);
router.delete('/:id', protect, isAdmin, controller.remove);

module.exports = router;