const service = require('./product.service');

const s3 = require('../../config/s3');

exports.create = async (req, res, next) => {
  try {
    let imageUrl = null;

    if (req.file) {
      const result = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `products/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      imageUrl = result.Location;
    }

    const product = await service.createProduct({
      ...req.body,
      image: imageUrl
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const products = await service.getProducts(req.query);
    res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const product = await service.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await service.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};