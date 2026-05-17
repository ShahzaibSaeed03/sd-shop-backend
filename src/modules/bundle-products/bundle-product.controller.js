const service = require('./bundle-product.service');

const s3 = require('../../config/s3');

// =========================
// CREATE
// =========================

exports.create = async (
  req,
  res,
  next
) => {

  try {

    let imageUrl = '';

    if (req.file) {

      const result = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `bundles/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      imageUrl = result.Location;

    }

const payload = {
  ...req.body,

  rules: req.body.rules || '',
  description: req.body.description || '',

  image: imageUrl
};

// ✅ remove empty _id from frontend
delete payload._id;

const bundle =
  await service.createBundle(payload);

    res.status(201).json({

      success: true,

      data: bundle

    });

  } catch (err) {

    next(err);

  }

};

// =========================
// GET ALL
// =========================

exports.getAll = async (
  req,
  res,
  next
) => {

  try {

    const data =
      await service.getBundles();

    res.json({

      success: true,

      total: data.length,

      data

    });

  } catch (err) {

    next(err);

  }

};

// =========================
// GET ONE
// =========================

exports.getOne = async (
  req,
  res,
  next
) => {

  try {

    const data =
      await service.getBundleById(
        req.params.id
      );

    if (!data) {

      return res.status(404).json({

        message: 'Bundle not found'

      });

    }

    res.json({

      success: true,

      data

    });

  } catch (err) {

    next(err);

  }

};

// =========================
// UPDATE
// =========================

exports.update = async (
  req,
  res,
  next
) => {

  try {

    let imageUrl =
      req.body.image || '';

    if (req.file) {

      const result = await s3.upload({

        Bucket: process.env.AWS_BUCKET,

        Key: `bundles/${Date.now()}-${req.file.originalname}`,

        Body: req.file.buffer,

        ContentType: req.file.mimetype

      }).promise();

      imageUrl = result.Location;

    }

   const payload = {
  ...req.body,

  rules: req.body.rules || '',
  description: req.body.description || '',

  image: imageUrl
};

// ✅ prevent _id overwrite
delete payload._id;

const bundle =
  await service.updateBundle(
    req.params.id,
    payload
  );

    res.json({

      success: true,

      data: bundle

    });

  } catch (err) {

    next(err);

  }

};

// =========================
// DELETE
// =========================

exports.remove = async (
  req,
  res,
  next
) => {

  try {

    await service.deleteBundle(
      req.params.id
    );

    res.json({

      success: true,

      message: 'Bundle deleted'

    });

  } catch (err) {

    next(err);

  }

};
// =========================
// GET BY CATEGORY
// =========================

exports.getByCategory = async (
  req,
  res,
  next
) => {

  try {

    const data =
      await service.getByCategory(
        req.params.categoryId
      );

    res.json({

      success: true,

      total: data.length,

      data

    });

  } catch (err) {

    next(err);

  }

};