const service = require('./coupon.service');
const s3 = require('../../config/s3');

exports.applyCoupon = async (req, res, next) => {
  try {
    const result = await service.applyCoupon(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createCoupon = async (req, res, next) => {
  try {

    let avatarUrl = null;

    if (req.file) {
      const result = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `coupons/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      avatarUrl = result.Location;
    }

    const coupon = await service.createCoupon({
      ...req.body,
      avatar: avatarUrl
    });

    res.status(201).json({
      success: true,
      data: coupon
    });

  } catch (err) {

    // ✅ DUPLICATE ERROR HANDLE
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Coupon code already exists'
      });
    }

    next(err);
  }
};

// ✅ UPDATE
exports.updateCoupon = async (req, res, next) => {
  try {

    let avatarUrl = req.body.avatar || null;

    // ✅ SAME LOGIC AS PRODUCT
    if (req.file) {
      const result = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `coupons/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      avatarUrl = result.Location;
    }

    const data = {
      ...req.body,
      avatar: avatarUrl
    };

    const coupon = await service.updateCoupon(req.params.id, data);

    res.json({
      success: true,
      data: coupon
    });

  } catch (err) {
    next(err);
  }
};

// GET ALL
exports.getCoupons = async (req, res) => {
  try {

    const result = await service.getCoupons(req.query);

    res.json({
      success: true,
      ...result   // 🔥 REQUIRED
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// GET ONE
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await service.getCouponById(req.params.id);

    res.json({
      success: true,
      data: coupon
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// ✅ DELETE
exports.deleteCoupon = async (req, res) => {
  try {

    await service.deleteCoupon(req.params.id);

    res.json({
      success: true,
      message: 'Coupon deleted'
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};