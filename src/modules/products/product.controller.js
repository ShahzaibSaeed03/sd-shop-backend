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
    const products = await service.getProducts(req.query, req.user);
    res.json(products);
  } catch (err) {
    next(err);
  }
};


exports.getOne = async (req, res, next) => {
  try {
    const product = await service.getProductById(req.params.id);

    // ✅ FIX 1: handle null
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 🔐 block inactive product for normal users
    if (!product.isActive && req.user?.role !== 'admin') {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);

  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {

    let imageUrl = req.body.image || null;

    // 🔥 HANDLE IMAGE UPLOAD
    if (req.file) {
      const result = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `products/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      imageUrl = result.Location;
    }

    const data = {
      ...req.body,
      image: imageUrl // ✅ IMPORTANT
    };

    // ❌ block non-admin
    if (req.user.role !== 'admin') {
      delete data.isActive;
    }

    const product = await service.updateProduct(req.params.id, data);

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

// ✅ POPULAR
exports.getPopular = async (req, res, next) => {
  try {
    const data = await service.getPopularProducts(req.query.limit || 10);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ✅ GAME COINS
exports.getCoins = async (req, res, next) => {
  try {
    const data = await service.getGameCoins(req.query.limit || 10);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ✅ HOT SELLING
exports.getHot = async (req, res, next) => {
  try {
    const data = await service.getHotSellingProducts(req.query.limit || 10);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.bulkUpdateMarkup = async (req, res, next) => {
  try {
    const updates = req.body; // [{id, markup}]

    const result = await Promise.all(
      updates.map(item => {

        if (item.markup < 0 || item.markup > 500) {
          throw new Error('Invalid markup value');
        }

        return Product.findByIdAndUpdate(
          item.id,
          { markup: item.markup },
          { new: true }
        );
      })
    );

    res.json(result);

  } catch (err) {
    next(err);
  }
};

exports.updateMarkupBulk = async (req, res) => {
  const { markup } = req.body;

  await Product.updateMany(
    {}, // all products
    { $set: { markup } }
  );

  res.json({ message: 'Bulk updated' });
};

exports.searchGames = async (req, res, next) => {
  try {
    const data = await service.searchGames(req.query.q, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getByCategory = async (req, res, next) => {
  try {
    const data = await service.getProductsByCategory(
      req.params.categoryId,
      req.user
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};