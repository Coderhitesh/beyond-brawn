const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { hmac, safeEqual, round2 } = require('../utils/helpers');
const { getRazorpay } = require('../config/razorpay');
const { Order, Payment } = require('../models');
const orderService = require('./order.service');
const email = require('./email.service');
const { notifyCustomer, notifyAdmin } = require('./notification.service');

/*
 * Browser callback after Razorpay Checkout. Nothing from the browser is trusted:
 *  1. HMAC-SHA256(order_id|payment_id, key_secret) must equal the signature.
 *  2. The payment is fetched from Razorpay and its order id, amount and status are checked.
 * Only then is the order marked paid.
 */
async function confirmFromClient({ razorpay_order_id: rzpOrderId, razorpay_payment_id: rzpPaymentId, razorpay_signature: signature }) {
  if (!env.razorpay.keySecret) throw new ApiError(503, 'Payment gateway is not configured', null, 'PAYMENT_NOT_CONFIGURED');
  const expected = hmac(`${rzpOrderId}|${rzpPaymentId}`, env.razorpay.keySecret);
  if (!safeEqual(expected, signature)) throw new ApiError(400, 'Payment verification failed', null, 'SIGNATURE_MISMATCH');

  const payment = await Payment.findOne({ razorpayOrderId: rzpOrderId });
  if (!payment) throw new ApiError(404, 'Payment record not found');
  if (payment.status === 'paid') return orderService.loadFull(payment.order);

  let remote;
  try {
    remote = await getRazorpay().payments.fetch(rzpPaymentId);
  } catch (e) {
    logger.error('Razorpay payment fetch failed:', e.error || e);
    throw new ApiError(502, 'Could not confirm the payment with the gateway. If money was deducted, the order will update automatically.', null, 'PAYMENT_GATEWAY_ERROR');
  }
  if (remote.order_id !== rzpOrderId || Number(remote.amount) !== payment.amountPaise || remote.currency !== payment.currency) {
    throw new ApiError(400, 'Payment details do not match this order', null, 'PAYMENT_MISMATCH');
  }
  if (remote.status === 'authorized') {
    try {
      remote = await getRazorpay().payments.capture(rzpPaymentId, payment.amountPaise, payment.currency);
    } catch (e) {
      logger.warn('Capture failed (auto-capture may already be on):', (e.error && e.error.description) || e.message);
    }
  }
  if (!['captured', 'authorized'].includes(remote.status)) throw new ApiError(400, 'Payment was not completed', null, 'PAYMENT_INCOMPLETE');

  return orderService.finalizePaid(payment, { paymentId: rzpPaymentId, signature, method: remote.method });
}

// Razorpay webhook. `rawBody` must be the untouched request buffer.
async function handleWebhook(rawBody, signature) {
  if (!env.razorpay.webhookSecret) throw new ApiError(503, 'Webhook secret is not configured');
  const expected = hmac(rawBody, env.razorpay.webhookSecret);
  if (!safeEqual(expected, signature || '')) throw new ApiError(400, 'Invalid webhook signature', null, 'SIGNATURE_MISMATCH');

  const event = JSON.parse(rawBody.toString('utf8'));
  const pay = event.payload && event.payload.payment && event.payload.payment.entity;
  const ref = event.payload && event.payload.refund && event.payload.refund.entity;

  switch (event.event) {
    case 'payment.captured':
    case 'order.paid': {
      if (!pay) break;
      const payment = await Payment.findOne({ razorpayOrderId: pay.order_id });
      if (payment && Number(pay.amount) === payment.amountPaise) await orderService.finalizePaid(payment, { paymentId: pay.id, method: pay.method });
      break;
    }
    case 'payment.failed':
      if (pay) await orderService.markPaymentFailed(pay.order_id, pay.error_description || pay.error_reason);
      break;
    case 'refund.processed':
      if (ref) await completeRefund({ razorpayPaymentId: ref.payment_id, refundId: ref.id });
      break;
    case 'refund.failed':
      if (ref) notifyAdmin('refund_failed', 'Refund failed at gateway', `Refund ${ref.id} for payment ${ref.payment_id} failed.`, '/admin/orders/refunds');
      break;
    default:
      break;
  }
  return { received: true };
}

// Customer closed the modal or the attempt failed in the browser. Informational only: never changes order state.
async function noteClientFailure(razorpayOrderId, reason) {
  await Payment.updateOne({ razorpayOrderId, status: 'created' }, { $set: { failureReason: `client: ${String(reason || 'dismissed').slice(0, 280)}` } });
}

async function refund(orderId, { amount, note } = {}, by = 'admin') {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await Payment.findById(order.payment);
  if (!payment || !payment.razorpayPaymentId || !['paid', 'refund_initiated'].includes(payment.status)) throw new ApiError(400, 'This order has no captured payment to refund', null, 'NOT_REFUNDABLE');

  const already = round2(payment.refunds.filter((r) => r.status !== 'failed').reduce((s, r) => s + r.amount, 0));
  const refundable = round2(payment.amount - already);
  const value = round2(amount || refundable);
  if (value <= 0 || value > refundable) throw new ApiError(400, `Refund amount must be between ₹1 and ₹${refundable}`, null, 'REFUND_AMOUNT');

  let result;
  try {
    result = await getRazorpay().payments.refund(payment.razorpayPaymentId, { amount: Math.round(value * 100), speed: 'normal', notes: { orderNumber: order.orderNumber, reason: note || '' } });
  } catch (e) {
    logger.error('Razorpay refund failed:', e.error || e);
    throw new ApiError(502, (e.error && e.error.description) || 'The gateway rejected the refund', null, 'REFUND_FAILED');
  }

  payment.refunds.push({ refundId: result.id, amount: value, status: result.status === 'processed' ? 'processed' : 'initiated', note });
  payment.status = 'refund_initiated';
  await payment.save();
  await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: 'refund_initiated' }, $push: { statusHistory: { status: order.status, note: `Refund of ₹${value} initiated${note ? `: ${note}` : ''}`, by, at: new Date() } } });

  const full = await orderService.loadFull(order._id);
  email.queue('refundInitiated', full.customer.email, { order: full, amount: value });
  notifyCustomer(full.user, 'refund_initiated', 'Refund initiated', `₹${value} refund started for ${full.orderNumber}.`, `/account/orders/${full.orderNumber}`);
  if (result.status === 'processed') return completeRefund({ razorpayPaymentId: payment.razorpayPaymentId, refundId: result.id });
  return full;
}

// Called by the refund.processed webhook, by instant refunds, or manually by an admin.
async function completeRefund({ razorpayPaymentId, refundId, orderId, by = 'system' }) {
  const payment = orderId ? await Payment.findOne({ order: orderId }) : await Payment.findOne({ razorpayPaymentId });
  if (!payment) return null;

  let changed = false;
  payment.refunds.forEach((r) => {
    if ((refundId ? r.refundId === refundId : true) && r.status !== 'processed') {
      r.status = 'processed'; // eslint-disable-line no-param-reassign
      changed = true;
    }
  });
  if (!changed && payment.status === 'refunded') return orderService.loadFull(payment.order);

  const refunded = round2(payment.refunds.filter((r) => r.status === 'processed').reduce((s, r) => s + r.amount, 0));
  const pending = payment.refunds.some((r) => r.status === 'initiated');
  const fully = refunded >= payment.amount;
  payment.status = pending ? 'refund_initiated' : fully ? 'refunded' : 'paid';
  await payment.save();

  const order = await Order.findById(payment.order);
  const set = { paymentStatus: payment.status };
  if (fully && ['Cancelled', 'Delivered', 'Confirmed', 'Processing', 'Packed'].includes(order.status)) set.status = 'Refunded';
  await Order.updateOne({ _id: order._id }, { $set: set, $push: { statusHistory: { status: set.status || order.status, note: `Refund of ₹${refunded} completed`, by, at: new Date() } } });

  const full = await orderService.loadFull(order._id);
  if (changed) {
    email.queue('refundCompleted', full.customer.email, { order: full, amount: refunded });
    notifyCustomer(full.user, 'refund_completed', 'Refund completed', `₹${refunded} refunded for ${full.orderNumber}.`, `/account/orders/${full.orderNumber}`);
  }
  return full;
}

module.exports = { confirmFromClient, handleWebhook, noteClientFailure, refund, completeRefund };
