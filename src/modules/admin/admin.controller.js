const User = require('../auth/auth.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');

exports.getDashboard = async (req, res, next) => {
  try {
    // 📊 Counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // 💰 Revenue
    const revenueData = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // 🕒 Recent Orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders
    });

  } catch (err) {
    next(err);
  }
};