const Category = require('./category.model');
const s3 = require('../../config/s3');
const { slugify } = require('../../utils/slugify');
const Order = require('../orders/order.model');

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

      // ✅ PRODUCTS
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },

      // ✅ ORDERS
      {
        $lookup: {
          from: 'orders',

          let: {
            categoryId: '$_id'
          },

          pipeline: [

            {
              $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'product'
              }
            },

            {
              $unwind: '$product'
            },

            {
              $match: {

                status: 'paid',

                $expr: {
                  $eq: [
                    '$product.category',
                    '$$categoryId'
                  ]
                }

              }
            }

          ],

          as: 'paidOrders'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          let: {
            categoryId: '$_id'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$category', '$$categoryId']
                }
              }
            },
            {
              $group: {
                _id: '$category',
                averageRating: {
                  $avg: '$rating'
                },
                totalReviews: {
                  $sum: 1
                }
              }
            }
          ],
          as: 'reviewStats'
        }
      },
      // ✅ STATS
      {
        $addFields: {

          totalProducts: {
            $size: '$products'
          },

          totalSold: {
            $size: '$paidOrders'
          },

          averageRating: {
            $ifNull: [
              {
                $round: [
                  {
                    $arrayElemAt: [
                      '$reviewStats.averageRating',
                      0
                    ]
                  },
                  1
                ]
              },
              0
            ]
          },

          totalReviews: {
            $ifNull: [
              {
                $arrayElemAt: [
                  '$reviewStats.totalReviews',
                  0
                ]
              },
              0
            ]
          }

        }
      },

      // ✅ RESPONSE
      {
        $project: {

          name: 1,
          code: 1,
          slug: 1,
          image: 1,
          isActive: 1,

          averageRating: 1,
          totalReviews: 1,

          totalProducts: 1,

          // ✅ NEW
          totalSold: 1,
          isSpecial: 1,
          specialTitle: 1,
          specialSubtitle: 1
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
exports.searchCategories = async (req, res, next) => {
  try {

    const q = req.query.q || '';

    if (!q.trim()) {
      return res.json({
        success: true,
        total: 0,
        data: []
      });
    }

    // ✅ guest OR normal user
    let filter = {
      isActive: true
    };

    // ✅ admin can see all
    if (req.user?.role === 'admin') {
      filter = {};
    }

    const categories = await Category.find({
      ...filter,

      name: {
        $regex: q,
        $options: 'i'
      }
    })
      .select('name image slug isActive')
      .limit(10);

    res.json({
      success: true,
      total: categories.length,
      data: categories
    });

  } catch (err) {
    next(err);
  }
};