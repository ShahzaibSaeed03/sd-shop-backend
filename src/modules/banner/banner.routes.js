const router = require('express').Router();
const controller = require('./banner.controller');
const upload = require('../../middlewares/upload.middleware');

const { protect, isAdmin } = require('../auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Banner management APIs
 */

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Get all active banners
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter banners by type
 *         example: homepage
 *     responses:
 *       200:
 *         description: List of banners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   image:
 *                     type: string
 *                   type:
 *                     type: string
 *                   order:
 *                     type: number
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create banner (Admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 example: homepage
 *               order:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  controller.create
);

/**
 * @swagger
 * /api/banners/{id}:
 *   put:
 *     summary: Update banner (Admin only)
 *     tags: [Banners]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               order:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 */
router.put('/:id', protect, isAdmin, controller.update);

/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Delete banner (Admin only)
 *     tags: [Banners]
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
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 */
router.delete('/:id', protect, isAdmin, controller.remove);

module.exports = router;