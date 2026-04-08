const service = require('./influencer.service');

exports.create = async (req, res, next) => {
  try {
    const data = await service.createInfluencer(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
};