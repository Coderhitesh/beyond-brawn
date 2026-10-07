const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const { paginate, pageMeta } = require('../utils/helpers');
const { User, Address, Order, Wishlist, Notification } = require('../models');

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
  ok(res, { user: user.toSafe() }, 'Profile saved');
});

exports.dashboard = asyncHandler(async (req, res) => {
  const visible = { user: req.user._id, paymentStatus: { $ne: 'pending' } };
  const [orders, active, wishlist, addresses, recent] = await Promise.all([
    Order.countDocuments(visible),
    Order.countDocuments({ ...visible, status: { $in: ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'] } }),
    Wishlist.findOne({ user: req.user._id }).select('products').lean(),
    Address.countDocuments({ user: req.user._id }),
    Order.find(visible).sort({ createdAt: -1 }).limit(3).select('orderNumber status paymentStatus pricing.total itemCount createdAt').lean(),
  ]);
  ok(res, { counts: { orders, activeOrders: active, wishlist: wishlist ? wishlist.products.length : 0, addresses }, recentOrders: recent });
});

/* ---------- addresses ---------- */
exports.listAddresses = asyncHandler(async (req, res) => ok(res, { addresses: await Address.find({ user: req.user._id }).sort({ isDefault: -1, updatedAt: -1 }).lean() }));

exports.createAddress = asyncHandler(async (req, res) => {
  const count = await Address.countDocuments({ user: req.user._id });
  if (count >= 10) throw new ApiError(400, 'You can save up to 10 addresses');
  const isDefault = req.body.isDefault || count === 0;
  if (isDefault) await Address.updateMany({ user: req.user._id }, { isDefault: false });
  created(res, { address: await Address.create({ ...req.body, user: req.user._id, isDefault }) }, 'Address saved');
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');
  if (req.body.isDefault) await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
  Object.assign(address, req.body, { isDefault: req.body.isDefault ?? address.isDefault });
  await address.save();
  ok(res, { address }, 'Address saved');
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found');
  if (address.isDefault) {
    const next = await Address.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  ok(res, {}, 'Address deleted');
});

/* ---------- notifications ---------- */
exports.notifications = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 20 });
  const filter = { audience: 'customer', user: req.user._id };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);
  ok(res, { notifications: items, unread }, 'Success', 200, pageMeta(pg, total));
});

exports.readNotifications = asyncHandler(async (req, res) => {
  await Notification.updateMany({ audience: 'customer', user: req.user._id, isRead: false }, { isRead: true });
  ok(res, {}, 'Marked as read');
});
