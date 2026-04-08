const router = require('express').Router();
const controller = require('./review.controller');

const { protect } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product review APIs
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create review (logged-in user)
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 64f123abc123xyz456
 *               rating:
 *                 type: number
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Excellent product!
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 product:
 *                   type: string
 *                 user:
 *                   type: string
 *                 rating:
 *                   type: number
 *                 comment:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, controller.create);

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get reviews by product
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f123abc123xyz456
 *     responses:
 *       200:
 *         description: Product reviews fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   example: 4.5
 *                 totalReviews:
 *                   type: number
 *                   example: 20
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       comment:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                       createdAt:
 *                         type: string
 */
router.get('/product/:productId', controller.getByProduct);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update review (only owner)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f123abc123xyz456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Updated review comment
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not allowed (not review owner)
 *       404:
 *         description: Review not found
 */
router.put('/:id', protect, controller.update);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review (only owner)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f123abc123xyz456
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 */
router.delete('/:id', protect, controller.remove);

module.exports = router;