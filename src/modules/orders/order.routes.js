const router = require('express').Router();
const controller = require('./order.controller');
const optionalAuth = require('../../middlewares/optionalAuth');


const { protect, isAdmin } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order and purchase APIs
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order (Buy Now)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 64f123abc123xyz456
 *               code:
 *                 type: string
 *                 example: DISCOUNT10
 *     responses:
 *       201:
 *         description: Order created with payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     product:
 *                       type: string
 *                     price:
 *                       type: number
 *                     originalPrice:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       example: pending
 *                 payment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     qr_code:
 *                       type: string
 *                     qr_code_base64:
 *                       type: string
 *                     copy_paste:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/',optionalAuth, controller.create);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get logged-in user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   price:
 *                     type: number
 *                   originalPrice:
 *                     type: number
 *                   discount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   product:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 */
router.get('/dashboard', protect, isAdmin, controller.getDashboard);

router.get('/my', protect, controller.getMyOrders);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', protect, isAdmin, controller.getAllOrders);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/status', protect, isAdmin, controller.updateStatus);


/**
 * @swagger
 * /api/orders/recent:
 *   get:
 *     summary: Get recent purchases (public)
 *     tags: [Orders]
 */
router.get('/recent', controller.getRecentPurchases);
router.post('/calculate', controller.calculatePrice);
router.get('/:id', protect, isAdmin, controller.getOne);
// ✅ HOME SECTIONS
router.post('/:id/retry', protect, isAdmin, controller.retry);
router.get('/my/recent', protect, controller.getMyRecentPurchases);
module.exports = router;