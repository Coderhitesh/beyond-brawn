const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const { paginate, pageMeta, safeEqual } = require('../utils/helpers');
const { Order } = require('../models');
const orderService = require('../services/order.service');
const invoiceService = require('../services/invoice.service');

// Orders whose payment was never attempted are abandoned checkouts and stay hidden from customers.
const visible = (userId) => ({ user: userId, paymentStatus: { $ne: 'pending' } });

exports.checkout = asyncHandler(async (req, res) => {
  const data = await orderService.createCheckout({ user: req.user || null, body: req.body });
  created(res, data, 'Order created. Complete the payment to confirm it.');
});

exports.list = asyncHandler(async (req, res) => {
  const pg = paginate(req.query, { defaultLimit: 10, maxLimit: 30 });
  const filter = visible(req.user._id);
  if (req.query.status) filter.status = String(req.query.status);
  const [orders, total] = await Promise.all([Order.find(filter).populate('items').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(), Order.countDocuments(filter)]);
  ok(res, { orders: orders.map(orderService.toPublic) }, 'Orders fetched successfully', 200, pageMeta(pg, total));
});

exports.detail = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user._id }).populate('items').lean();
  if (!order) throw new ApiError(404, 'Order not found', null, 'NOT_FOUND');
  ok(res, { order: orderService.toPublic(order) });
});

// Guest order lookup: order number + the email used at checkout.
exports.track = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.body.orderNumber }).populate('items').lean();
  if (!order || !safeEqual(order.customer.email, req.body.email) || order.paymentStatus === 'pending') throw new ApiError(404, 'No order matches that order number and email', null, 'NOT_FOUND');
  ok(res, { order: orderService.toPublic(order) });
});

exports.cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelByCustomer(req.user, req.params.orderNumber, req.body.reason);
  ok(res, { order: orderService.toPublic(order) }, 'Order cancelled');
});

exports.invoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: req.user._id }).populate('items').lean();
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.placedAt) throw new ApiError(400, 'An invoice is available once the order is paid');
  await invoiceService.streamInvoice(order, res);
});
