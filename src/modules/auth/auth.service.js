const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./auth.model');

exports.register = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error('Email already exists');

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    ...data,
    password: hashedPassword
  });

  return user;
};

exports.login = async (data) => {
  const user = await User.findOne({ email: data.email });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};