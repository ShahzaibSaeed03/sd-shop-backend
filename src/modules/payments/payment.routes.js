const router = require('express').Router();
const controller = require('./payment.controller');
const { protect } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment and webhook APIs
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1500
 *               method:
 *                 type: string
 *                 example: pix
 *               token:
 *                 type: string
 *                 example: payment_token_if_required
 *     responses:
 *       200:
 *         description: Payment created (MercadoPago response)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: pending
 *                 qr_code:
 *                   type: string
 *                 qr_code_base64:
 *                   type: string
 *                 copy_paste:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, controller.create);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: MercadoPago webhook (updates order status)
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               type: payment
 *               data:
 *                 id: 123456789
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       500:
 *         description: Webhook error
 */
router.post('/webhook', controller.webhook);

module.exports = router;