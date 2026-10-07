const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/respond');
const { paginate, pageMeta, escapeRegex, sendCsv } = require('../../utils/helpers');
const { Newsletter, ContactMessage, Notification, Coupon, CouponUsage } = require('../../models');

/* ---------- newsletter ---------- */
exports.newsletter = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) filter.email = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
  if (req.query.subscribed === 'true') filter.isSubscribed = true;
  if (req.query.subscribed === 'false') filter.isSubscribed = false;
  if (req.query.format === 'csv') {
    const rows = await Newsletter.find(filter).sort({ createdAt: -1 }).limit(50000).lean();
    return sendCsv(res, 'newsletter.csv', rows, [{ label: 'Email', value: 'email' }, { label: 'Subscribed', value: (r) => (r.isSubscribed ? 'Yes' : 'No') }, { label: 'Source', value: 'source' }, { label: 'Date', value: 'createdAt' }]);
  }
  const pg = paginate(req.query, { defaultLimit: 30, maxLimit: 200 });
  const [items, total] = await Promise.all([Newsletter.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(), Newsletter.countDocuments(filter)]);
  return ok(res, { items }, 'Success', 200, pageMeta(pg, total));
});
exports.removeSubscriber = asyncHandler(async (req, res) => {
  await Newsletter.findByIdAndDelete(req.params.id);
  ok(res, {}, 'Subscriber removed');
});

/* ---------- contact messages ---------- */
exports.messages = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = ['new', 'read', 'replied'].includes(req.query.status) ? { status: req.query.status } : {};
  const [items, total, unread] = await Promise.all([ContactMessage.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(), ContactMessage.countDocuments(filter), ContactMessage.countDocuments({ status: 'new' })]);
  ok(res, { items, unread }, 'Success', 200, pageMeta(pg, total));
});
exports.messageStatus = asyncHandler(async (req, res) => {
  if (!['new', 'read', 'replied'].includes(req.body.status)) throw new ApiError(400, 'Invalid status');
  const item = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!item) throw new ApiError(404, 'Message not found');
  ok(res, { item }, 'Message updated');
});
exports.removeMessage = asyncHandler(async (req, res) => {
  await ContactMessage.findByIdAndDelete(req.params.id);
  ok(res, {}, 'Message deleted');
});

/* ---------- admin notifications ---------- */
exports.notifications = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { audience: 'admin', ...(req.query.unread === 'true' ? { isRead: false } : {}) };
  const [items, total, unread] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(), Notification.countDocuments(filter), Notification.countDocuments({ audience: 'admin', isRead: false })]);
  ok(res, { items, unread }, 'Success', 200, pageMeta(pg, total));
});
exports.readNotifications = asyncHandler(async (req, res) => {
  const filter = { audience: 'admin', isRead: false, ...(req.body && req.body.id ? { _id: req.body.id } : {}) };
  await Notification.updateMany(filter, { isRead: true });
  ok(res, {}, 'Marked as read');
});

/* ---------- coupon usage statistics ---------- */
exports.couponStats = asyncHandler(async (req, res) => {
  const [coupons, usage] = await Promise.all([
    Coupon.find().select('code discountType value usedCount usageLimit isActive expiryDate').sort({ usedCount: -1 }).lean(),
    CouponUsage.aggregate([{ $group: { _id: '$coupon', uses: { $sum: 1 }, discount: { $sum: '$discount' }, last: { $max: '$createdAt' } } }]),
  ]);
  const map = new Map(usage.map((u) => [String(u._id), u]));
  ok(res, {
    items: coupons.map((c) => {
      const u = map.get(String(c._id)) || {};
      return { ...c, uses: u.uses || 0, totalDiscount: Math.round((u.discount || 0) * 100) / 100, lastUsedAt: u.last || null };
    }),
  });
});
exports.couponUsage = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { coupon: req.params.id };
  const [items, total] = await Promise.all([CouponUsage.find(filter).populate('order', 'orderNumber pricing.total').populate('user', 'name email').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(), CouponUsage.countDocuments(filter)]);
  ok(res, { items }, 'Success', 200, pageMeta(pg, total));
});
