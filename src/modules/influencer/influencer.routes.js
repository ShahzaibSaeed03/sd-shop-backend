const router = require('express').Router();
const controller = require('./influencer.controller');

const { protect, isAdmin } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Influencers
 *   description: Influencer management APIs (Admin only)
 */

/**
 * @swagger
 * /api/influencers:
 *   post:
 *     summary: Create influencer
 *     tags: [Influencers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               code:
 *                 type: string
 *                 example: JOHN10
 *               discount:
 *                 type: number
 *                 example: 10
 *               platform:
 *                 type: string
 *                 example: Instagram
 *     responses:
 *       201:
 *         description: Influencer created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 code:
 *                   type: string
 *                 discount:
 *                   type: number
 *                 platform:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.post('/', protect, isAdmin, controller.create);

/**
 * @swagger
 * /api/influencers:
 *   get:
 *     summary: Get all influencers
 *     tags: [Influencers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of influencers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *                   discount:
 *                     type: number
 *                   platform:
 *                     type: string
 */
router.get('/', protect, isAdmin, controller.getAll);

module.exports = router;