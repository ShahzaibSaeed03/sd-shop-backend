const authService = require('./auth.service');
const User = require('./auth.model');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken'); // 🔥 also missing in your code
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// register
exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// login
exports.login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json(data);
  } catch (err) {
    res.status(401).json({
      message: err.message || "Invalid credentials"
    });
  }
};

// ✅ THIS MUST EXIST
exports.makeAdmin = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token required' });
    }

    // ✅ VERIFY GOOGLE TOKEN
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const { sub, email, name } = payload;

    let user = await User.findOne({ email });

    // ✅ CREATE USER IF NOT EXISTS
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
        provider: 'google',
        cashbackPoints: 100,            // ✅ 1 BRL reward
        totalCashbackEarned: 1
      });
    }

    // ✅ GENERATE TOKEN (SAME AS LOGIN)
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user
    });

  } catch (err) {
    console.log('❌ GOOGLE LOGIN ERROR:', err.message);
    next(err);
  }
};
exports.getWallet = async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    points: user.cashbackPoints,
    balance: user.cashbackPoints / 100,
    earned: user.totalCashbackEarned,
    spent: user.totalCashbackSpent
  });
};
exports.getMyCashback = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json({
      points: user.cashbackPoints,
      balanceBRL: user.cashbackPoints / 100,
      earned: user.totalCashbackEarned,
      spent: user.totalCashbackSpent
    });

  } catch (err) {
    next(err);
  }
};