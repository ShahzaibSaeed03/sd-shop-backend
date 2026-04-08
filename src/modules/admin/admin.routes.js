const router = require('express').Router();
const controller = require('./admin.controller');

const { protect, isAdmin } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard APIs
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                   example: 120
 *                 totalProducts:
 *                   type: number
 *                   example: 50
 *                 totalOrders:
 *                   type: number
 *                   example: 75
 *                 totalRevenue:
 *                   type: number
 *                   example: 150000
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       price:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         example: 2026-04-08T10:00:00Z
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       product:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.get('/dashboard', protect, isAdmin, controller.getDashboard);

module.exports = router;