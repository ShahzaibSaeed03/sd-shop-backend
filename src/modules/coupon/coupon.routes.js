const express = require('express');
const router = express.Router();
const controller = require('./coupon.controller');
const { protect, isAdmin } = require('../auth/auth.middleware');
const upload = require('../../middlewares/upload.middleware');


// APPLY
router.post('/apply', controller.applyCoupon);

// CREATE
router.post('/', protect, isAdmin, upload.single('avatar'), controller.createCoupon);

// GET ALL
router.get('/', protect, isAdmin, controller.getCoupons);

// GET ONE
router.get('/:id', protect, isAdmin, controller.getCouponById);

// UPDATE
router.put('/:id', protect, isAdmin, upload.single('avatar'), controller.updateCoupon);

// DELETE
router.delete('/:id', protect, isAdmin, controller.deleteCoupon);

module.exports = router;