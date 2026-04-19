const Category = require('./category.model');
const s3 = require('../../config/s3');
const { slugify } = require('../../utils/slugify');

// category.controller.js

exports.updateCategory = async (req, res, next) => {
  try {

    let imageUrl = req.body.image || null;

    if (req.file) {
      const result = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `categories/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }).promise();

      imageUrl = result.Location;
    }

    // ✅ SLUG LOGIC HERE
    const baseSlug = slugify(req.body.name);

    let slug = baseSlug;
    let count = 1;

    while (await Category.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        code: req.body.code,
        slug,
        image: imageUrl,
        isActive: req.body.isActive // ✅ ADD THIS
      },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {

    const data = await Category.aggregate([
      {
        $lookup: {
          from: 'products', // 👈 collection name
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $addFields: {
          totalProducts: { $size: '$products' }
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          slug: 1,
          image: 1,
          isActive: 1,
          totalProducts: 1
        }
      }
    ]);

    res.json({
      success: true,
      total: data.length,
      data
    });

  } catch (err) {
    next(err);
  }
};