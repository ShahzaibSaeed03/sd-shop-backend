// middleware/optionalAuth.js
const jwt = require('jsonwebtoken');
const User = require('../modules/auth/auth.model');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return next(); // ✅ no user, continue as guest
    }

    const token = header.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (user) {
      req.user = user; // ✅ attach user if exists
    }

    next();

  } catch (err) {
    // ❗ ignore errors → treat as guest
    next();
  }
};