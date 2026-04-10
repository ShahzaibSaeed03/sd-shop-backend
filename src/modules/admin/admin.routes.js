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
 *         description: Dashboard data
 */
router.get('/dashboard', protect, isAdmin, controller.getDashboard);

module.exports = router;