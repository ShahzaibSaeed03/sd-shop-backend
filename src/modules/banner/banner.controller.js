const service = require('./banner.service');

const s3 = require('../../config/s3');

exports.create = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) throw new Error('Image is required');

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET,
      Key: `uploads/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(uploadParams).promise();

    const data = {
      ...req.body,
      image: result.Location // ✅ S3 URL
    };

    const banner = await service.createBanner(data);

    res.status(201).json(banner);

  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const banners = await service.getBanners(req.query); // ✅ IMPORTANT
    res.json(banners);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const banner = await service.updateBanner(req.params.id, req.body);
    res.json(banner);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteBanner(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    next(err);
  }
};