const service = require('./user.service');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await service.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await service.getUserDetails(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};
exports.updateUserRole = async (
  req,
  res,
  next
) => {
  try {

    const user =
      await service.updateUserRole(
        req.params.id,
        req.body.role
      );

    res.json({
      success: true,
      data: user
    });

  } catch (err) {
    next(err);
  }
};