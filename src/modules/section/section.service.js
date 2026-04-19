const Section = require('./section.model');
const Product = require('../products/product.model');

// CREATE
exports.createSection = async (data) => {

  if (!data.name) throw new Error('Section name required');

  // mode logic
  if (data.mode === 'manual') {
    data.apiSource = null;
  }

  if (data.mode === 'api') {
    data.products = [];
  }

  return await Section.create(data);
};

// GET ALL (admin)
exports.getSections = async () => {
  return await Section.find()
    .populate('products', 'name image')
    .sort({ order: 1 });
};

// GET FOR FRONTEND (important)
exports.getFrontendSections = async () => {
  const sections = await Section.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  const result = [];

  for (const section of sections) {

    let data = [];

    // 🔵 MANUAL
    if (section.mode === 'manual') {
      data = await Product.find({
        _id: { $in: section.products },
        isActive: true
      }).select('name image price');
    }

    // 🟢 API MODE (REAL LOGIC)
    if (section.mode === 'api') {

      switch (section.apiSource) {

        case 'top_games':
          data = await Product.find({ isActive: true })
            .sort({ createdAt: -1 }) // or popularity
            .limit(10);
          break;

        case 'hot_selling':
          data = await Product.find({ isActive: true })
            .sort({ price: -1 }) // better: orders count
            .limit(10);
          break;

        case 'new_releases':
          data = await Product.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(10);
          break;

        case 'featured':
          data = await Product.find({ isActive: true, featured: true })
            .limit(10);
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

// UPDATE
exports.updateSection = async (id, data) => {

  if (data.mode === 'manual') {
    data.apiSource = null;
  }

  if (data.mode === 'api') {
    data.products = [];
  }

  return await Section.findByIdAndUpdate(id, data, { new: true });
};

// DELETE
exports.deleteSection = async (id) => {
  return await Section.findByIdAndDelete(id);
};

// REORDER
exports.reorderSections = async (items) => {
  return await Promise.all(
    items.map((item, index) =>
      Section.findByIdAndUpdate(item.id, { order: index })
    )
  );
};

// API OPTIONS (dropdown)
exports.getOptions = () => {
  return [
    { label: 'Top Games', value: 'top_games' },
    { label: 'Hot Selling', value: 'hot_selling' },
    { label: 'Featured', value: 'featured' },
    { label: 'New Releases', value: 'new_releases' }
  ];
};