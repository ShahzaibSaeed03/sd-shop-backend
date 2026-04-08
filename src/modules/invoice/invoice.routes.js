const router = require('express').Router();
const controller = require('./invoice.controller');

const { protect, isAdmin } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice management APIs (Admin only)
 */

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                     example: 1500
 *                   createdAt:
 *                     type: string
 *                     example: 2026-04-08T10:00:00Z
 *                   user:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                   product:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.get('/', protect, isAdmin, controller.getAll);

module.exports = router;