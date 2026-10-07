const ApiError = require('../utils/ApiError');
const { round2 } = require('../utils/helpers');
const { Coupon, CouponUsage } = require('../models');

const fail = (message) => new ApiError(400, message, null, 'COUPON_INVALID');

/*
 * Validates a coupon against server-priced cart lines and returns the discount.
 * lines: [{ productId, categoryId, lineTotal }]
 */
async function evaluate(code, { lines, subtotal, userId, email }) {
  const coupon = await Coupon.findOne({ code: String(code || '').trim().toUpperCase() });
  if (!coupon || !coupon.isActive) throw fail('This coupon code is not valid');

  const now = new Date();
  if (coupon.startDate && coupon.startDate > now) throw fail('This coupon is not active yet');
  if (coupon.expiryDate && coupon.expiryDate < now) throw fail('This coupon has expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw fail('This coupon has reached its usage limit');
  if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) throw fail(`Add items worth ₹${round2(coupon.minOrderAmount - subtotal)} more to use this coupon`);

  if (coupon.perUserLimit > 0 && (userId || email)) {
    const who = [];
    if (userId) who.push({ user: userId });
    if (email) who.push({ email: String(email).toLowerCase() });
    const used = await CouponUsage.countDocuments({ coupon: coupon._id, $or: who });
    if (used >= coupon.perUserLimit) throw fail('You have already used this coupon');
  }

  const products = coupon.applicableProducts.map(String);
  const categories = coupon.applicableCategories.map(String);
  const restricted = products.length > 0 || categories.length > 0;
  const eligible = restricted ? lines.filter((l) => products.includes(String(l.productId)) || categories.includes(String(l.categoryId))) : lines;
  const eligibleTotal = round2(eligible.reduce((s, l) => s + l.lineTotal, 0));
  if (eligibleTotal <= 0) throw fail('This coupon does not apply to the items in your cart');

  let discount = coupon.discountType === 'percentage' ? (eligibleTotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  discount = round2(Math.min(discount, eligibleTotal));

  return { coupon, discount, eligibleKeys: eligible.map((l) => l.key), eligibleTotal };
}

// Called once per paid order. The unique index on CouponUsage.order makes this idempotent.
async function recordUsage(order) {
  if (!order.coupon || !order.coupon.id) return;
  try {
    await CouponUsage.create({ coupon: order.coupon.id, code: order.coupon.code, user: order.user, email: order.customer.email, order: order._id, discount: order.pricing.couponDiscount });
    await Coupon.updateOne({ _id: order.coupon.id }, { $inc: { usedCount: 1 } });
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
}

module.exports = { evaluate, recordUsage };
