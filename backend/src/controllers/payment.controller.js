const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respond');
const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');

exports.verify = asyncHandler(async (req, res) => {
  const order = await paymentService.confirmFromClient(req.body);
  ok(res, { order: orderService.toPublic(order) }, 'Payment verified. Your order is confirmed.');
});

exports.failed = asyncHandler(async (req, res) => {
  await paymentService.noteClientFailure(req.body.razorpay_order_id, req.body.reason);
  ok(res, {}, 'Noted');
});

// Mounted with express.raw so req.body is the exact buffer Razorpay signed.
exports.webhook = asyncHandler(async (req, res) => {
  await paymentService.handleWebhook(req.body, req.headers['x-razorpay-signature']);
  res.json({ success: true, message: 'Webhook processed', data: {} });
});
