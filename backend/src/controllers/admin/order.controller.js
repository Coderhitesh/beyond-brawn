const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/respond');
const { paginate, pageMeta, escapeRegex, sendCsv } = require('../../utils/helpers');
const { dateRange } = require('../../utils/time');
const { Order, Payment } = require('../../models');
const { ORDER_STATUSES } = require('../../models/_shared');
const orderService = require('../../services/order.service');
const paymentService = require('../../services/payment.service');
const invoiceService = require('../../services/invoice.service');

function buildFilter(q) {
  const filter = {};
  if (q.status && ORDER_STATUSES.includes(q.status)) filter.status = q.status;
  // Abandoned checkouts (never paid, never attempted) are hidden unless explicitly requested.
  else if (q.abandoned !== 'true') filter.$nor = [{ status: 'Pending', paymentStatus: 'pending' }];
  if (q.paymentStatus) filter.paymentStatus = String(q.paymentStatus);
  if (q.refunds === 'true') filter.paymentStatus = { $in: ['refund_initiated', 'refunded'] };
  if (q.customer) filter.user = String(q.customer);
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q).trim().slice(0, 60)), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.email': rx }, { 'customer.phone': rx }, { 'tracking.trackingNumber': rx }];
  }
  if (q.from || q.to) {
    const { from, to } = dateRange(q);
    filter.createdAt = { $gte: from, $lt: to };
  }
  return filter;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  if (req.query.format === 'csv') {
    const rows = await Order.find(filter).sort({ createdAt: -1 }).limit(10000).lean();
    return sendCsv(res, 'orders.csv', rows, [
      { label: 'Order', value: 'orderNumber' }, { label: 'Date', value: (r) => r.placedAt || r.createdAt }, { label: 'Customer', value: (r) => r.customer.name }, { label: 'Email', value: (r) => r.customer.email }, { label: 'Phone', value: (r) => r.customer.phone },
      { label: 'Items', value: 'itemCount' }, { label: 'Subtotal', value: (r) => r.pricing.subtotal }, { label: 'Coupon', value: (r) => r.coupon && r.coupon.code }, { label: 'Discount', value: (r) => r.pricing.couponDiscount }, { label: 'Shipping', value: (r) => r.pricing.shipping }, { label: 'Tax', value: (r) => r.pricing.tax }, { label: 'Total', value: (r) => r.pricing.total },
      { label: 'Status', value: 'status' }, { label: 'Payment', value: 'paymentStatus' }, { label: 'City', value: (r) => r.shippingAddress && r.shippingAddress.city }, { label: 'State', value: (r) => r.shippingAddress && r.shippingAddress.state }, { label: 'Pincode', value: (r) => r.shippingAddress && r.shippingAddress.pincode },
      { label: 'Carrier', value: (r) => r.tracking && r.tracking.carrier }, { label: 'Tracking', value: (r) => r.tracking && r.tracking.trackingNumber },
    ]);
  }
  const pg = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });
  const [items, total, counts] = await Promise.all([
    Order.find(filter).select('orderNumber customer pricing.total itemCount status paymentStatus paymentMethod tracking placedAt createdAt isGuest').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $match: { $nor: [{ status: 'Pending', paymentStatus: 'pending' }] } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  return ok(res, { items, counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) }, 'Success', 200, pageMeta(pg, total));
});

exports.get = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items').populate('user', 'name email phone createdAt').lean();
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await Payment.findById(order.payment).lean();
  ok(res, { order, payment, allowedStatuses: orderService.STATUS_FLOW[order.status] || [] });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body, req.admin.name);
  ok(res, { order, allowedStatuses: orderService.STATUS_FLOW[order.status] || [] }, `Order marked ${order.status}`);
});

exports.bulkStatus = asyncHandler(async (req, res) => {
  const { ids, value: status } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw new ApiError(400, 'Choose a valid status');
  const results = [];
  for (const id of ids) {
    try {
      await orderService.updateStatus(id, { status }, req.admin.name); // eslint-disable-line no-await-in-loop
      results.push({ id, ok: true });
    } catch (e) {
      results.push({ id, ok: false, message: e.message });
    }
  }
  const done = results.filter((r) => r.ok).length;
  ok(res, { results }, `${done} of ${ids.length} order(s) updated`);
});

exports.refund = asyncHandler(async (req, res) => ok(res, { order: await paymentService.refund(req.params.id, req.body, req.admin.name) }, 'Refund initiated'));

exports.completeRefund = asyncHandler(async (req, res) => {
  const order = await paymentService.completeRefund({ orderId: req.params.id, by: req.admin.name });
  if (!order) throw new ApiError(404, 'No payment found for this order');
  ok(res, { order }, 'Refund marked as completed');
});

exports.invoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items').lean();
  if (!order) throw new ApiError(404, 'Order not found');
  await invoiceService.streamInvoice(order, res);
});
