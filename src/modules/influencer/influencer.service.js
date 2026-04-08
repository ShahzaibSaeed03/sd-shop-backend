const Influencer = require('./influencer.model');

exports.createInfluencer = async (data) => {
  return await Influencer.create(data);
};

exports.getAll = async () => {
  return await Influencer.find().sort({ createdAt: -1 });
};

exports.applyCode = async (code, price) => {
  const influencer = await Influencer.findOne({ code, isActive: true });

  if (!influencer) throw new Error('Invalid code');

  const discountAmount = (price * influencer.discount) / 100;
  const finalPrice = price - discountAmount;

  // update stats
  influencer.usageCount += 1;
  influencer.totalRevenue += finalPrice;
  await influencer.save();

  return {
    finalPrice,
    discountAmount,
    influencer
  };
};