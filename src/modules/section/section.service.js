const Section = require('./section.model');
const Category = require('../categorey/category.model'); // ✅ FIXED PATH
const orderService = require('../orders/order.service');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');



// ==========================
// VALIDATE CATEGORIES
// ==========================
const validateCategories = async (ids = []) => {
  if (!ids || !ids.length) return [];

  const categories = await Category.find({
    _id: { $in: ids }
  }).select('_id');

  return categories.map(c => c._id);
};

// ==========================
// GET API CATEGORIES (DYNAMIC)
// ==========================
const getApiCategories = async (apiSource) => {
  let query = { isActive: true };
  let sort = { createdAt: -1 };

  switch (apiSource) {
    case 'hot_selling':
      sort = { totalProducts: -1 };
      break;

    case 'featured':
      query.featured = true;
      break;

    case 'new_releases':
      sort = { createdAt: -1 };
      break;

    case 'top_games':
    default:
      sort = { createdAt: -1 };
  }

  const categories = await Category.find(query)
    .sort(sort)
    .limit(10)
    .select('_id');

  return categories.map(c => c._id);
};

// ==========================
// CREATE
// ==========================
exports.createSection = async (data) => {

  // ✅ Manual → name required
  if (data.mode === 'manual' && !data.name) {
    throw new Error('Section name required');
  }

  // ✅ API → auto name + auto categories
  if (data.mode === 'api') {
    data.name = data.name || data.apiSource;

    data.categories = await getApiCategories(data.apiSource);
  }

  // ✅ Manual → validate categories
  if (data.mode === 'manual') {
    data.apiSource = null;
    data.categories = await validateCategories(data.categories);
  }

  return await Section.create(data);
};

// ==========================
// GET ALL (ADMIN)
// ==========================
exports.getSections = async () => {
  return await Section.find()
    .populate('categories', 'name image')
    .sort({ order: 1 });
};

// ==========================
// GET FRONTEND
// ==========================
exports.getFrontendSections = async (userId) => {

  const sections = await Section.find({
    isActive: true
  })
    .populate(
      'categories',
      `
      name
      image
      slug
      averageRating
      totalReviews
      `
    )
    .sort({ order: 1 })
    .lean();

  // ✅ CALCULATE SOLD COUNTS
  const formattedSections = await Promise.all(

   sections.map(async (section) => ({

  _id: section._id,

  name: section.name,

  subtitle: section.subtitle,

  tabKey: section.tabKey,

  apiSource: section.apiSource,

  // ✅ ADD THESE
  isSpecial: section.isSpecial,

  specialTitle:
    section.specialTitle,

  specialSubtitle:
    section.specialSubtitle,

  backgroundType:
    section.backgroundType,

  items: await Promise.all(

        section.categories.map(async (c) => {

          // ✅ count paid orders
          const totalSold =
            await Order.countDocuments({

              status: 'paid',

              product: {
                $in: await Product.find({
                  category: c._id
                }).distinct('_id')
              }

            });

          return {

            _id: c._id,

            name: c.name,

            image: c.image,

            slug: c.slug,

            averageRating:
              c.averageRating || 0,

            totalReviews:
              c.totalReviews || 0,

            totalSold

          };

        })

      )

    }))

  );

  // ✅ RECENT PURCHASES
  const recentItems =
    await orderService.getRecentPurchases(
      userId,
      8
    );

  const finalSections = [];

  if (
    recentItems &&
    recentItems.length > 0
  ) {

    finalSections.push({

      _id: 'recent-purchases',

      name: 'Recently Purchased',

      items: recentItems

    });

  }

  formattedSections.forEach(s => {
    finalSections.push(s);
  });

  return finalSections;
};

// ==========================
// UPDATE
// ==========================
exports.updateSection = async (id, data) => {

  // ✅ Manual
  if (data.mode === 'manual') {
    data.apiSource = null;

    if (data.categories) {
      data.categories = await validateCategories(data.categories);
    }
  }

  // ✅ API
  if (data.mode === 'api') {
    data.name = data.name || data.apiSource;

    // ⚠️ only update categories if not provided
    if (!data.categories) {
      data.categories = await getApiCategories(data.apiSource);
    }
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