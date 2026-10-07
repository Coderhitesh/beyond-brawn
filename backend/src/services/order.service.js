const mongoose = require('mongoose');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { sha256, formatINR } = require('../utils/helpers');
const { getRazorpay } = require('../config/razorpay');
const { Order, OrderItem, Payment, Cart, Address, Counter, Product } = require('../models');
const settings = require('./settings.service');
const pricing = require('./pricing.service');
const shipping = require('./shipping.service');
const inventory = require('./inventory.service');
const couponService = require('./coupon.service');
const email = require('./email.service');
const { notifyAdmin, notifyCustomer } = require('./notification.service');

// Allowed admin transitions. Pending / Failed / Refunded are set by the payment flow only.
const STATUS_FLOW = {
  Pending: ['Cancelled'],
  Confirmed: ['Processing', 'Packed', 'Shipped', 'Cancelled'],
  Processing: ['Packed', 'Shipped', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Out for Delivery', 'Delivered'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
  Failed: [],
  Refunded: [],
};
const CUSTOMER_CANCELLABLE = ['Confirmed', 'Processing'];
const STATUS_EMAIL = { Processing: 'orderProcessing', Shipped: 'orderShipped', 'Out for Delivery': 'outForDelivery', Delivered: 'orderDelivered', Cancelled: 'orderCancelled' };
const STATUS_NOTIFY = {
  Processing: ['order_processing', 'Order is being prepared'],
  Packed: ['order_packed', 'Order packed'],
  Shipped: ['order_shipped', 'Order shipped'],
  'Out for Delivery': ['order_out_for_delivery', 'Out for delivery'],
  Delivered: ['order_delivered', 'Order delivered'],
  Cancelled: ['order_cancelled', 'Order cancelled'],
};

const orderLink = (o) => `/account/orders/${o.orderNumber}`;
const loadFull = (id) => Order.findById(id).populate('items').lean();

async function nextOrderNumber() {
  const { orderPrefix } = await settings.get('general');
  const year = new Date().getFullYear();
  const seq = await Counter.next(`order-${year}`);
  return `${orderPrefix || 'BB'}-${year}-${String(seq).padStart(6, '0')}`;
}

function checkoutPayload(order, payment, siteName) {
  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    pricing: order.pricing,
    razorpay: {
      keyId: env.razorpay.keyId,
      orderId: payment.razorpayOrderId,
      amount: payment.amountPaise,
      currency: payment.currency,
      name: siteName,
      description: `Order ${order.orderNumber}`,
      prefill: { name: order.customer.name, email: order.customer.email, contact: order.customer.phone },
    },
  };
}

/*
 * Checkout: validate cart -> price from DB -> reserve stock -> create Razorpay order -> persist a Pending order.
 * The order only becomes Confirmed / paid in payment.service after signature verification.
 */
async function createCheckout({ user, body }) {
  const general = await settings.get('general');
  const paymentCfg = await settings.get('payment');
  if (paymentCfg.razorpayEnabled === false) throw new ApiError(503, 'Online payments are temporarily unavailable', null, 'PAYMENT_DISABLED');
  const rzp = getRazorpay();

  // 1. Items
  let rawItems;
  let couponCode = body.couponCode || null;
  let fromCart = false;
  if (body.buyNow) rawItems = [body.buyNow];
  else if (user) {
    const cart = await Cart.findOne({ user: user._id }).lean();
    rawItems = cart ? cart.items : [];
    if (!couponCode && cart) couponCode = cart.couponCode;
    fromCart = true;
  } else rawItems = body.items || [];
  if (!rawItems.length) throw new ApiError(400, 'Your cart is empty', null, 'CART_EMPTY');

  // 2. Customer + address
  if (!user && !body.guest) throw new ApiError(400, 'Enter your contact details to check out as a guest', null, 'GUEST_REQUIRED');
  let addr = body.address;
  if (body.addressId) {
    if (!user) throw new ApiError(400, 'Add a delivery address');
    const saved = await Address.findOne({ _id: body.addressId, user: user._id }).lean();
    if (!saved) throw new ApiError(404, 'Address not found');
    addr = saved;
  }
  const shippingAddress = { fullName: addr.fullName, phone: addr.phone, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country || 'India' };
  await shipping.assertServiceable(shippingAddress.pincode);
  const customer = user ? { name: user.name, email: user.email, phone: user.phone || shippingAddress.phone } : { name: body.guest.name, email: body.guest.email, phone: body.guest.phone };

  // 3. Server-side pricing
  const priced = await pricing.priceCart(rawItems, { couponCode, userId: user && user._id, email: customer.email, methodCode: body.shippingMethod });
  if (!priced.lines.length) throw new ApiError(400, 'Your cart is empty', null, 'CART_EMPTY');
  if (priced.hasIssues) {
    throw new ApiError(409, 'Some items in your cart need attention', { lines: priced.lines.filter((l) => l.issue).map((l) => ({ key: l.key, name: l.name, issue: l.issue, message: l.issueText, stock: l.stock })) }, 'CART_ISSUES');
  }
  if (couponCode && priced.couponError) throw new ApiError(400, priced.couponError, null, 'COUPON_INVALID');
  const { total } = priced.pricing;
  if (total < 1) throw new ApiError(400, 'Order total must be at least ₹1');
  const amountPaise = Math.round(total * 100);

  // 4. Duplicate-order guard: same buyer + same cart + same total within the payment window reuses the pending order.
  const cartHash = sha256(
    JSON.stringify([user ? String(user._id) : customer.email, priced.lines.map((l) => [l.key, l.quantity, l.price]), priced.coupon && priced.coupon.code, priced.shippingMethod.code, shippingAddress, amountPaise])
  );
  const existing = await Order.findOne({ cartHash, status: 'Pending', paymentStatus: { $in: ['pending', 'failed'] }, stockReserved: true, expiresAt: { $gt: new Date(Date.now() + 60 * 1000) } }).populate('payment');
  if (existing && existing.payment) return checkoutPayload(existing, existing.payment, general.siteName);

  // 5. Reserve stock (atomic per line, rolled back on failure)
  const orderId = new mongoose.Types.ObjectId();
  await inventory.reserveLines(priced.lines, orderId, 'Reserved at checkout');

  try {
    const orderNumber = await nextOrderNumber();
    let rzpOrder;
    try {
      rzpOrder = await rzp.orders.create({ amount: amountPaise, currency: 'INR', receipt: orderNumber, notes: { orderNumber, email: customer.email } });
    } catch (e) {
      logger.error('Razorpay order create failed:', e.error || e);
      throw new ApiError(502, 'Could not start the payment. Try again.', null, 'PAYMENT_GATEWAY_ERROR');
    }

    const items = await OrderItem.insertMany(
      priced.lines.map((l) => ({ order: orderId, user: user ? user._id : null, product: l.productId, variant: l.variantId, name: l.name, slug: l.slug, sku: l.sku, image: l.image, variantLabel: l.variantLabel, mrp: l.mrp, price: l.price, quantity: l.quantity, lineTotal: l.lineTotal, gstRate: l.gstRate }))
    );
    const payment = await Payment.create({ order: orderId, user: user ? user._id : null, razorpayOrderId: rzpOrder.id, amount: total, amountPaise, currency: 'INR' });
    const { freeShippingThreshold, amountToFreeShipping, ...pricingSnapshot } = priced.pricing;
    const order = await Order.create({
      _id: orderId,
      orderNumber,
      user: user ? user._id : null,
      isGuest: !user,
      customer,
      items: items.map((i) => i._id),
      itemCount: priced.itemCount,
      shippingAddress,
      shippingMethod: { code: priced.shippingMethod.code, name: priced.shippingMethod.name, minDays: priced.shippingMethod.minDays, maxDays: priced.shippingMethod.maxDays },
      pricing: pricingSnapshot,
      coupon: priced.coupon ? { code: priced.coupon.code, id: priced.coupon.id } : undefined,
      status: 'Pending',
      paymentStatus: 'pending',
      payment: payment._id,
      razorpayOrderId: rzpOrder.id,
      statusHistory: [{ status: 'Pending', note: 'Awaiting payment', by: 'system' }],
      cartHash,
      stockReserved: true,
      notes: body.notes,
      fromCart,
      expiresAt: new Date(Date.now() + (paymentCfg.pendingOrderExpiryMinutes || 30) * 60 * 1000),
    });

    // First address a logged-in customer uses is saved to their address book.
    if (user && !body.addressId && !(await Address.exists({ user: user._id }))) {
      await Address.create({ user: user._id, ...shippingAddress, isDefault: true }).catch(() => null);
    }
    return checkoutPayload(order, payment, general.siteName);
  } catch (e) {
    await inventory.releaseLines(priced.lines, orderId, 'Checkout failed');
    await Promise.all([OrderItem.deleteMany({ order: orderId }), Payment.deleteMany({ order: orderId }), Order.deleteOne({ _id: orderId })]).catch(() => null);
    throw e;
  }
}

/*
 * Marks an order paid. Idempotent: the Payment row is claimed atomically, so the browser callback
 * and the Razorpay webhook can both arrive without double-processing.
 */
async function finalizePaid(payment, { paymentId, signature, method }) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $in: ['created', 'failed'] } },
    { $set: { status: 'paid', razorpayPaymentId: paymentId, method, paidAt: new Date(), failureReason: null, ...(signature ? { razorpaySignature: signature } : {}) } },
    { new: true }
  );
  if (!claimed) return loadFull(payment.order); // already processed

  const before = await Order.findOneAndUpdate(
    { _id: payment.order },
    {
      $set: { status: 'Confirmed', paymentStatus: 'paid', paymentMethod: method, placedAt: new Date(), stockReserved: true },
      $unset: { expiresAt: 1 },
      $push: { statusHistory: { status: 'Confirmed', note: `Payment received (${paymentId})`, by: 'system', at: new Date() } },
    },
    { new: false }
  );
  const order = await loadFull(payment.order);

  // The reservation may have been released if payment arrived after the pending window.
  if (before && !before.stockReserved) {
    try {
      await inventory.reserveLines(order.items, order._id, 'Re-reserved after late payment');
    } catch (e) {
      await Order.updateOne({ _id: order._id }, { stockReserved: false });
      notifyAdmin('stock_conflict', 'Paid order needs a stock check', `${order.orderNumber} was paid after its reservation expired and stock is short.`, `/admin/orders/${order._id}`);
    }
  }

  await Promise.all([
    couponService.recordUsage(order),
    Product.bulkWrite(order.items.map((i) => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { soldCount: i.quantity } } } }))),
    order.user && before && before.fromCart !== false ? Cart.updateOne({ user: order.user }, { $set: { items: [], couponCode: null } }) : null,
  ]).catch((e) => logger.error('Post-payment bookkeeping failed:', e.message));

  email.queue('orderConfirmation', order.customer.email, { order });
  email.queue('paymentSuccess', order.customer.email, { order, paymentId, method });
  email.adminRecipient().then((to) => email.queue('adminNewOrder', to, { order }));
  notifyCustomer(order.user, 'order_placed', 'Order placed', `Order ${order.orderNumber} is confirmed.`, orderLink(order));
  notifyCustomer(order.user, 'payment_success', 'Payment successful', `${formatINR(order.pricing.total)} received for ${order.orderNumber}.`, orderLink(order));
  notifyAdmin('new_order', 'New order', `${order.orderNumber} from ${order.customer.name} for ${formatINR(order.pricing.total)}`, `/admin/orders/${order._id}`);
  notifyAdmin('payment_received', 'Payment received', `${formatINR(order.pricing.total)} for ${order.orderNumber} via ${method || 'Razorpay'}`, `/admin/orders/${order._id}`);
  return order;
}

// A failed attempt. Stock stays reserved until the pending window ends so the customer can retry.
async function markPaymentFailed(razorpayOrderId, reason) {
  const payment = await Payment.findOneAndUpdate({ razorpayOrderId, status: 'created' }, { $set: { status: 'failed', failureReason: reason } }, { new: true });
  if (!payment) return;
  await Order.updateOne({ _id: payment.order, paymentStatus: 'pending' }, { $set: { paymentStatus: 'failed' }, $push: { statusHistory: { status: 'Pending', note: `Payment failed: ${reason || 'unknown'}`, by: 'system', at: new Date() } } });
  const order = await loadFull(payment.order);
  if (order) {
    email.queue('paymentFailed', order.customer.email, { order });
    notifyCustomer(order.user, 'payment_failed', 'Payment failed', `Payment for ${order.orderNumber} did not go through.`, '/cart');
  }
}

// Unpaid orders past their window: mark Failed and return the stock.
async function releaseStaleOrders() {
  const stale = await Order.find({ status: 'Pending', paymentStatus: { $in: ['pending', 'failed'] }, expiresAt: { $lt: new Date() } }).select('_id').limit(200).lean();
  let released = 0;
  for (const { _id } of stale) {
    // eslint-disable-next-line no-await-in-loop
    const before = await Order.findOneAndUpdate(
      { _id, status: 'Pending', paymentStatus: { $in: ['pending', 'failed'] } },
      { $set: { status: 'Failed', paymentStatus: 'failed', stockReserved: false }, $push: { statusHistory: { status: 'Failed', note: 'Payment not completed in time', by: 'system', at: new Date() } } },
      { new: false }
    );
    if (before && before.stockReserved) {
      // eslint-disable-next-line no-await-in-loop
      const items = await OrderItem.find({ order: _id }).lean();
      // eslint-disable-next-line no-await-in-loop
      await inventory.releaseLines(items, _id, 'Unpaid order expired');
      released += 1;
    }
  }
  return released;
}

async function cancelOrder(order, { reason, by }) {
  const wasPaid = order.paymentStatus === 'paid';
  const before = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status: 'Cancelled', cancelledAt: new Date(), cancelReason: reason || undefined, stockReserved: false }, $push: { statusHistory: { status: 'Cancelled', note: reason, by, at: new Date() } } },
    { new: false }
  );
  if (!before) throw new ApiError(409, 'This order was just updated. Refresh and try again.', null, 'ORDER_CHANGED');
  if (before.stockReserved) {
    const items = await OrderItem.find({ order: order._id }).lean();
    await inventory.releaseLines(items, order._id, 'Order cancelled', 'return');
  }

  let refundExpected = false;
  if (wasPaid) {
    try {
      // Lazy require: payment.service depends on this module.
      // eslint-disable-next-line global-require
      await require('./payment.service').refund(order._id, { note: 'Order cancelled' }, by);
      refundExpected = true;
    } catch (e) {
      logger.error(`Auto-refund failed for ${order.orderNumber}:`, e.message);
      notifyAdmin('refund_failed', 'Refund needs attention', `Automatic refund for cancelled order ${order.orderNumber} failed: ${e.message}`, `/admin/orders/${order._id}`);
      refundExpected = true; // the customer is still owed the refund; admin completes it manually
    }
  }
  const full = await loadFull(order._id);
  email.queue('orderCancelled', full.customer.email, { order: full, refundExpected });
  notifyCustomer(full.user, 'order_cancelled', 'Order cancelled', `Order ${full.orderNumber} was cancelled.`, orderLink(full));
  return full;
}

async function updateStatus(orderId, { status, note, tracking, notifyCustomer: shouldNotify = true }, adminName) {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  const trackingPatch = {};
  if (tracking) {
    ['carrier', 'trackingNumber', 'trackingUrl'].forEach((k) => {
      if (tracking[k] !== undefined) trackingPatch[`tracking.${k}`] = tracking[k];
    });
  }

  if (status === order.status) {
    if (Object.keys(trackingPatch).length) await Order.updateOne({ _id: order._id }, { $set: trackingPatch });
    return loadFull(order._id);
  }
  if (!(STATUS_FLOW[order.status] || []).includes(status)) {
    throw new ApiError(400, `An order that is "${order.status}" cannot be moved to "${status}"`, { allowed: STATUS_FLOW[order.status] }, 'INVALID_TRANSITION');
  }
  if (status === 'Cancelled') {
    if (Object.keys(trackingPatch).length) await Order.updateOne({ _id: order._id }, { $set: trackingPatch });
    return cancelOrder(order, { reason: note, by: adminName });
  }
  if (order.paymentStatus !== 'paid') throw new ApiError(400, 'Only paid orders can be processed', null, 'ORDER_UNPAID');

  const set = { status, ...trackingPatch };
  if (status === 'Delivered') set.deliveredAt = new Date();
  const updated = await Order.findOneAndUpdate({ _id: order._id, status: order.status }, { $set: set, $push: { statusHistory: { status, note, by: adminName, at: new Date() } } }, { new: true });
  if (!updated) throw new ApiError(409, 'This order was just updated. Refresh and try again.', null, 'ORDER_CHANGED');

  const full = await loadFull(order._id);
  if (shouldNotify) {
    if (STATUS_EMAIL[status]) email.queue(STATUS_EMAIL[status], full.customer.email, { order: full });
    if (STATUS_NOTIFY[status]) notifyCustomer(full.user, STATUS_NOTIFY[status][0], STATUS_NOTIFY[status][1], `Order ${full.orderNumber}: ${status}.`, orderLink(full));
  }
  return full;
}

async function cancelByCustomer(user, orderNumber, reason) {
  const order = await Order.findOne({ orderNumber, user: user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!CUSTOMER_CANCELLABLE.includes(order.status)) throw new ApiError(400, 'This order can no longer be cancelled online. Contact support for help.', null, 'NOT_CANCELLABLE');
  return cancelOrder(order, { reason: reason || 'Cancelled by customer', by: 'customer' });
}

// Shape returned to customers: no internal fields.
function toPublic(o) {
  if (!o) return null;
  return {
    id: o._id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    placedAt: o.placedAt,
    deliveredAt: o.deliveredAt,
    cancelledAt: o.cancelledAt,
    cancelReason: o.cancelReason,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    customer: o.customer,
    isGuest: o.isGuest,
    itemCount: o.itemCount,
    items: (o.items || []).map((i) => (i && i.name ? { id: i._id, product: i.product, variant: i.variant, name: i.name, slug: i.slug, sku: i.sku, image: i.image, variantLabel: i.variantLabel, mrp: i.mrp, price: i.price, quantity: i.quantity, lineTotal: i.lineTotal } : i)),
    shippingAddress: o.shippingAddress,
    shippingMethod: o.shippingMethod,
    pricing: o.pricing,
    coupon: o.coupon && o.coupon.code ? { code: o.coupon.code } : null,
    tracking: o.tracking,
    statusHistory: (o.statusHistory || []).map((h) => ({ status: h.status, note: h.by === 'system' || h.by === 'customer' ? h.note : undefined, at: h.at })),
    canCancel: CUSTOMER_CANCELLABLE.includes(o.status),
  };
}

module.exports = { STATUS_FLOW, CUSTOMER_CANCELLABLE, createCheckout, finalizePaid, markPaymentFailed, releaseStaleOrders, cancelOrder, updateStatus, cancelByCustomer, toPublic, loadFull };
