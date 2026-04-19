const service = require('./banner.service');
const s3 = require('../../config/s3');

// slug generator
const generateSlug = (text) => {
  return text
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// image validation
const validateImage = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowed.includes(file.mimetype)) {
    throw new Error('Invalid image format');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be less than 2MB');
  }
};

// CREATE
exports.create = async (req, res, next) => {
  try {
    const desktop = req.files?.desktopImage?.[0];
    const mobile = req.files?.mobileImage?.[0];

    if (!desktop) throw new Error('Desktop image required');

    validateImage(desktop);
    if (mobile) validateImage(mobile);

    // upload desktop
    const desktopUpload = await s3.upload({
      Bucket: process.env.AWS_BUCKET,
      Key: `banners/${Date.now()}-desktop-${desktop.originalname}`,
      Body: desktop.buffer,
      ContentType: desktop.mimetype
    }).promise();

    let mobileUrl = null;

    if (mobile) {
      const mobileUpload = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `banners/${Date.now()}-mobile-${mobile.originalname}`,
        Body: mobile.buffer,
        ContentType: mobile.mimetype
      }).promise();

      mobileUrl = mobileUpload.Location;
    }

    const slug = generateSlug(req.body.title || req.body.section);

    const banner = await service.createBanner({
      ...req.body,
      slug,
      desktopImage: desktopUpload.Location,
      mobileImage: mobileUrl
    });

    res.status(201).json(banner);

  } catch (err) {
    next(err);
  }
};

// GET
exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getBanners(req.query, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// UPDATE
exports.update = async (req, res, next) => {
  try {
    const desktop = req.files?.desktopImage?.[0];
    const mobile = req.files?.mobileImage?.[0];

    const updateData = { ...req.body };

    if (req.body.title) {
      updateData.slug = generateSlug(req.body.title);
    }

    if (desktop) {
      validateImage(desktop);

      const uploaded = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `banners/${Date.now()}-desktop-${desktop.originalname}`,
        Body: desktop.buffer,
        ContentType: desktop.mimetype
      }).promise();

      updateData.desktopImage = uploaded.Location;
    }

    if (mobile) {
      validateImage(mobile);

      const uploaded = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `banners/${Date.now()}-mobile-${mobile.originalname}`,
        Body: mobile.buffer,
        ContentType: mobile.mimetype
      }).promise();

      updateData.mobileImage = uploaded.Location;
    }

    const banner = await service.updateBanner(req.params.id, updateData);

    res.json(banner);

  } catch (err) {
    next(err);
  }
};

// DELETE
exports.remove = async (req, res, next) => {
  try {
    await service.deleteBanner(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    next(err);
  }
};

// REORDER
exports.reorder = async (req, res, next) => {
  try {
    console.log('REORDER BODY:', req.body); // 🔥 DEBUG

    await service.reorderBanners(req.body);

    res.json({ message: 'Order updated' });
  } catch (err) {
    console.error(err);
    next(err);
  }
};