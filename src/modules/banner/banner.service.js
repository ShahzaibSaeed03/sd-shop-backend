const Banner = require('./banner.model');


exports.createBanner = async (data) => {
  return await Banner.create(data);
};


exports.getBanners = async (query) => {
  const filter = { isActive: true };

  // ✅ APPLY TYPE FILTER
  if (query.type) {
    filter.type = query.type;
  }

  return await Banner.find(filter).sort({ order: 1 });
};

exports.updateBanner = async (id, data) => {
  return await Banner.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteBanner = async (id) => {
  return await Banner.findByIdAndDelete(id);
};