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
 *     summary: Get all banners
 *     tags: [Banners]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by title (optional)
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
 *                   title:
 *                     type: string
 *                     example: Summer Sale
 *                   image:
 *                     type: string
 *                     example: https://your-bucket.s3.amazonaws.com/uploads/banner.jpg
 *                   createdAt:
 *                     type: string
 */
router.get('/', controller.getAll);

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create banner (Admin, upload to S3)
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
 *               title:
 *                 type: string
 *                 example: Big Discount
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Banner created with S3 image URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 image:
 *                   type: string
 *                   example: https://your-bucket.s3.amazonaws.com/uploads/banner.jpg
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
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
 *     summary: Update banner (Admin)
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Banner Title
 *     responses:
 *       200:
 *         description: Banner updated
 */
router.put('/:id', protect, isAdmin, controller.update);

/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Delete banner (Admin)
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
 *         description: Banner deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Banner deleted
 */
router.delete('/:id', protect, isAdmin, controller.remove);

module.exports = router;