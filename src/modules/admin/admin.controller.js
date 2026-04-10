const User = require('../auth/auth.model');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');

exports.getDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // ✅ Only PAID orders
    const totalOrders = await Order.countDocuments({ status: 'paid' });

    // ✅ Revenue only from paid
    const revenueData = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // ✅ Recent paid orders
    const recentOrders = await Order.find({ status: 'paid' })
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // ✅ Status stats (optional but powerful)
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      statusStats
    });

  } catch (err) {
    next(err);
  }
};