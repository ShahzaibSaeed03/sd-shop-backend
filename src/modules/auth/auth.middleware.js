const jwt = require('jsonwebtoken');
const User = require('./auth.model');

// 🔐 Protect
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Unauthorized');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new Error('User not found');

    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// 👑 Admin only
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden (Admin only)' });
  }
  next();
};