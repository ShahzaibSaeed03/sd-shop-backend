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

exports.updateUserRole = async (
  userId,
  role
) => {

  if (
    !['admin', 'user'].includes(role)
  ) {
    throw new Error('Invalid role');
  }

  const user =
    await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

exports.getUserDetails = async (
  userId
) => {

  const user =
    await User.findById(userId)
      .select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  const orders =
    await Order.find({
      user: userId
    })
    .populate(
      'product',
      'name image price'
    )
    .sort({
      createdAt: -1
    });

  // =========================
  // TOTALS
  // =========================

  const totalSpent =
    orders.reduce(
      (sum, o) =>
        sum + (o.totalAmount || o.price || 0),
      0
    );

  const totalCashbackUsed =
    orders.reduce(
      (sum, o) =>
        sum + (o.cashbackUsed || 0),
      0
    );

  const totalCashbackEarned =
    orders.reduce(
      (sum, o) =>
        sum + (o.cashbackEarned || 0),
      0
    );

  const totalCouponDiscount =
    orders.reduce(
      (sum, o) =>
        sum + (o.couponDiscount || 0),
      0
    );

  const totalCoinsUsed =
    orders.reduce(
      (sum, o) =>
        sum + (o.cashbackPointsUsed || 0),
      0
    );

  // =========================
  // PURCHASED PRODUCTS
  // =========================

  const purchasedProducts =
    orders.map(o => ({
      orderId: o._id,

      productId: o.product?._id,

      productName:
        o.product?.name,

      productImage:
        o.product?.image,

      productPrice:
        o.product?.price,

      paidAmount:
        o.totalAmount,

      originalPrice:
        o.originalPrice,

      cashbackUsed:
        o.cashbackUsed,

      cashbackEarned:
        o.cashbackEarned,

      couponDiscount:
        o.couponDiscount,

      coinsUsed:
        o.cashbackPointsUsed,

      couponCode:
        o.couponCode,

      paymentMethod:
        o.paymentMethod,

      status:
        o.status,

      createdAt:
        o.createdAt
    }));

  return {

    user,

    stats: {

      totalOrders:
        orders.length,

      totalSpent,

      totalCashbackUsed,

      totalCashbackEarned,

      totalCouponDiscount,

      totalCoinsUsed
    },

    purchasedProducts
  };
};