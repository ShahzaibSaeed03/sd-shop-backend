const Section = require('./section.model');
const Product = require('../products/product.model');

// ==========================
// CREATE
// ==========================

const getProductsWithStats = async (match = {}, limit = 10, sort = { createdAt: -1 }) => {

  return await Product.aggregate([

    { $match: match },

    // ✅ REVIEWS
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product",
        as: "reviews"
      }
    },

    // ✅ ORDERS
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "product",
        as: "orders"
      }
    },

    // ✅ CALCULATE
    {
      $addFields: {
        totalReviews: { $size: "$reviews" },
        rating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            0
          ]
        },
        sold: { $size: "$orders" }
      }
    },

    // ✅ CLEAN
    {
      $project: {
        reviews: 0,
        orders: 0
      }
    },

    { $sort: sort },
    { $limit: limit }

  ]);
};


const validateProducts = async (ids = []) => {
  const products = await Product.find({
    _id: { $in: ids }
  }).select('_id');

  return products.map(p => p._id);
};
exports.createSection = async (data) => {

  if (!data.name) throw new Error('Section name required');

  if (data.mode === 'manual') {
    data.apiSource = null;

    // ✅ ONLY VALID PRODUCT IDS SAVED
    data.products = await validateProducts(data.products);
  }

  if (data.mode === 'api') {
    data.products = [];
  }

  return await Section.create(data);
};

// ==========================
// GET ALL (ADMIN)
// ==========================
exports.getSections = async () => {
  return await Section.find()
    .populate('products', 'name image')
    .sort({ order: 1 });
};

// ==========================
// GET FRONTEND (IMPORTANT)
// ==========================
exports.getFrontendSections = async () => {
  const sections = await Section.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  const result = [];

  for (const section of sections) {

    let data = [];

    // ==========================
    // 🔵 MANUAL MODE
    // ==========================
    if (section.mode === 'manual') {

      const products = await getProductsWithStats({
        _id: { $in: section.products },
        isActive: true
      }, 50);


      // ✅ KEEP ORDER + INCLUDE EVEN WITHOUT CATEGORY
      data = section.products
        .map(id => {
          const p = products.find(x => x._id.toString() === id.toString());

          if (!p || !p.isActive) return null;

          return {
            _id: p._id,
            name: p.name,
            image: p.image, // ✅ fallback
            price: p.price
          };
        })
        .filter(Boolean);
    }

    // ==========================
    // 🟢 API MODE
    // ==========================
    if (section.mode === 'api') {

      switch (section.apiSource) {

        case 'top_games':
          data = await getProductsWithStats(
            { isActive: true },
            10,
            { createdAt: -1 }
          );
          break;

       case 'hot_selling':
  data = await getProductsWithStats(
    { isActive: true },
    10,
    { sold: -1 }
  );
  break;

        case 'new_releases':
          data = await getProductsWithStats(
            { isActive: true },
            10,
            { createdAt: -1 }
          );
          break;
        

        case 'featured':
          data = await getProductsWithStats(
            { isActive: true, featured: true },
            10
          );
          break;

        default:
          data = [];
      }
    }

    result.push({
      ...section,
      items: data
    });
  }

  return result;
};

// ==========================
// UPDATE
// ==========================
exports.updateSection = async (id, data) => {

  if (data.mode === 'manual') {
    data.apiSource = null;

    if (data.products) {
      data.products = await validateProducts(data.products);
    }
  }

  if (data.mode === 'api') {
    data.products = [];
  }

  return await Section.findByIdAndUpdate(id, data, { new: true });
};

// ==========================
// DELETE
// ==========================
exports.deleteSection = async (id) => {
  return await Section.findByIdAndDelete(id);
};

// ==========================
// REORDER
// ==========================
exports.reorderSections = async (items) => {
  return await Promise.all(
    items.map((item, index) =>
      Section.findByIdAndUpdate(item.id, { order: index })
    )
  );
};

// ==========================
// OPTIONS (DROPDOWN)
// ==========================
exports.getOptions = () => {
  return [
    { label: 'Top Games', value: 'top_games' },
    { label: 'Hot Selling', value: 'hot_selling' },
    { label: 'Featured', value: 'featured' },
    { label: 'New Releases', value: 'new_releases' }
  ];
};