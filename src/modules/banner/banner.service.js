const Banner = require('./banner.model');

// CREATE
exports.createBanner = async (data) => {
  return await Banner.create(data);
};

// GET
exports.getBanners = async (query, user) => {
  const filter = {};

  if (!user || user.role !== 'admin') {
    filter.isActive = true;
  }

  if (query.section) {
    filter.section = query.section;
  }

  return await Banner.find(filter).sort({ order: 1 });
};

// UPDATE
exports.updateBanner = async (id, data) => {
  return await Banner.findByIdAndUpdate(id, data, { new: true });
};

// DELETE
exports.deleteBanner = async (id) => {
  return await Banner.findByIdAndDelete(id);
};

// REORDER
exports.reorderBanners = async (items) => {

  const bulk = items.map((item, index) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: index } }
    }
  }));

  return await Banner.bulkWrite(bulk);
};