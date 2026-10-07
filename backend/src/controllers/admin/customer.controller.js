const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/respond');
const { paginate, pageMeta, escapeRegex, sendCsv } = require('../../utils/helpers');
const { User, Order, Address } = require('../../models');

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'blocked') filter.isActive = false;
  if (req.query.verified === 'true') filter.isEmailVerified = true;
  if (req.query.verified === 'false') filter.isEmailVerified = false;

  const pg = req.query.format === 'csv' ? { page: 1, limit: 20000, skip: 0 } : paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(), User.countDocuments(filter)]);
  const stats = await Order.aggregate([{ $match: { user: { $in: users.map((u) => u._id) }, paymentStatus: 'paid' } }, { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$pricing.total' }, last: { $max: '$placedAt' } } }]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  const items = users.map((u) => {
    const s = map.get(String(u._id)) || {};
    return { _id: u._id, name: u.name, email: u.email, phone: u.phone, isActive: u.isActive, isEmailVerified: u.isEmailVerified, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, orders: s.orders || 0, spent: s.spent || 0, lastOrderAt: s.last || null };
  });
  if (req.query.format === 'csv') {
    return sendCsv(res, 'customers.csv', items, [{ label: 'Name', value: 'name' }, { label: 'Email', value: 'email' }, { label: 'Phone', value: 'phone' }, { label: 'Verified', value: (r) => (r.isEmailVerified ? 'Yes' : 'No') }, { label: 'Orders', value: 'orders' }, { label: 'Spent', value: 'spent' }, { label: 'Joined', value: 'createdAt' }]);
  }
  return ok(res, { items }, 'Success', 200, pageMeta(pg, total));
});

exports.get = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw new ApiError(404, 'Customer not found');
  const [addresses, orders, [stats]] = await Promise.all([
    Address.find({ user: user._id }).lean(),
    Order.find({ user: user._id, paymentStatus: { $ne: 'pending' } }).select('orderNumber status paymentStatus pricing.total itemCount placedAt createdAt').sort({ createdAt: -1 }).limit(50).lean(),
    Order.aggregate([{ $match: { user: user._id, paymentStatus: 'paid' } }, { $group: { _id: null, orders: { $sum: 1 }, spent: { $sum: '$pricing.total' } } }]),
  ]);
  ok(res, { customer: user, addresses, orders, stats: stats || { orders: 0, spent: 0 } });
});

exports.setActive = asyncHandler(async (req, res) => {
  const isActive = Boolean(req.body.isActive);
  // Bumping tokenVersion signs a blocked customer out everywhere.
  const user = await User.findByIdAndUpdate(req.params.id, { isActive, ...(isActive ? {} : { $inc: { tokenVersion: 1 } }) }, { new: true });
  if (!user) throw new ApiError(404, 'Customer not found');
  ok(res, { customer: user }, isActive ? 'Customer unblocked' : 'Customer blocked');
});
