const BundleProduct = require('./bundle-product.model');

// =========================
// CREATE
// =========================

exports.createBundle = async (data) => {

  return await BundleProduct.create(data);

};

// =========================
// GET ALL
// =========================

exports.getBundles = async () => {

  return await BundleProduct.find()
    .populate(
      'category',
      'name image'
    )
    .populate(
      'baseProduct',
      'name image price'
    )
    .sort({
      createdAt: -1
    });

};

// =========================
// GET ONE
// =========================

exports.getBundleById = async (id) => {

  return await BundleProduct.findById(id)
    .populate('category', 'name image')
    .populate('baseProduct', 'name image price');

};

// =========================
// UPDATE
// =========================

exports.updateBundle = async (
  id,
  data
) => {

  return await BundleProduct.findByIdAndUpdate(
    id,
    data,
    {
      new: true
    }
  )
    .populate('category', 'name image')
    .populate('baseProduct', 'name image price');

};

// =========================
// DELETE
// =========================

exports.deleteBundle = async (id) => {

  return await BundleProduct.findByIdAndDelete(id);

};

// =========================
// GET BY CATEGORY
// =========================

exports.getByCategory = async (
  categoryId
) => {

  return await BundleProduct.find({

    category: categoryId,

    isActive: true

  })

    .populate(
      'category',
      'name image'
    )

    .populate(
      'baseProduct',
      'name image price'
    )

    .sort({
      createdAt: -1
    });

};