const service = require('./section.service');

// CREATE
exports.create = async (req, res, next) => {
  try {
    const data = await service.createSection(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// GET ADMIN
exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getSections();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET FRONTEND
exports.getFrontend = async (req, res, next) => {
  try {
    console.log("USER FROM TOKEN:", req.user); // 🔥 MUST ADD

    const userId = req.user?._id || null;

    const data = await service.getFrontendSections(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// UPDATE
exports.update = async (req, res, next) => {
  try {
    const data = await service.updateSection(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.remove = async (req, res, next) => {
  try {
    await service.deleteSection(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// REORDER
exports.reorder = async (req, res, next) => {
  try {
    await service.reorderSections(req.body);
    res.json({ message: 'Reordered' });
  } catch (err) {
    next(err);
  }
};

// OPTIONS
exports.options = (req, res) => {
  res.json(service.getOptions());
};