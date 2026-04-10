const User = require('../auth/auth.model');
const Order = require('../orders/order.model');

exports.getAllUsers = async () => {
  return await User.find()
    .select('-password')
    .sort({ createdAt: -1 });
};

exports.getUserDetails = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found');

  const orders = await Order.find({ user: userId })
    .populate('product')
    .sort({ createdAt: -1 });

  // 💰 Total spent
  const totalSpent = orders.reduce((sum, o) => sum + o.price, 0);

  return {
    user,
    orders,
    totalOrders: orders.length,
    totalSpent
  };
};