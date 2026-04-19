const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./auth.model');

// register
exports.register = async (data) => {
  const existing = await User.findOne({ email: data.email });

  if (existing) {
    const err = new Error('Email already exists');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    ...data,
    password: hashedPassword
  });

  return user;
};

// login
exports.login = async (data) => {
  const user = await User.findOne({ email: data.email });

  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(data.password, user.password);

  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};