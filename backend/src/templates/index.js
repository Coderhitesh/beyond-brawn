const { esc, button, otpBox, p, h1, small, itemsTable, addressBlock, layout } = require('./layout');
const { formatINR } = require('../utils/helpers');

const orderLink = (o) => (o.isGuest ? `/track-order?order=${o.orderNumber}` : `/account/orders/${o.orderNumber}`);
const first = (name = '') => esc(String(name).trim().split(' ')[0] || 'there');
const orderName = (o) => first(o.customer && o.customer.name);
const trackingBlock = (o) => {
  const t = o.tracking || {};
  if (!t.trackingNumber) return '';
  return p(`<strong>Courier:</strong> ${esc(t.carrier || 'Courier partner')}<br><strong>Tracking number:</strong> ${esc(t.trackingNumber)}${t.trackingUrl ? `<br><a href="${esc(t.trackingUrl)}" style="color:#000">Track on the courier site</a>` : ''}`);
};

// Each template: { label, subject(data), body(data), preheader?(data) }. `sample` feeds the admin preview.
const TEMPLATES = {
  welcome: {
    label: 'Welcome email',
    subject: () => 'Welcome to Beyond Brawn',
    body: (d) => h1(`You're in, ${first(d.name)}.`) + p('Your account is verified. Your orders, addresses and wishlist now live in one place.') + p('Not sure where to start? Whey and creatine are what most people pick first.') + button('Shop best sellers', '/shop?sort=best-selling'),
  },
  verifyEmailOtp: {
    label: 'Email verification OTP',
    subject: (d) => `${d.otp} is your Beyond Brawn verification code`,
    body: (d) => h1('Verify your email') + p(`Hi ${first(d.name)}, enter this code to finish creating your account.`) + otpBox(d.otp) + p(`The code is valid for ${d.ttl} minutes.`) + small('Did not create an account? Ignore this email. Never share this code with anyone, including our support team.'),
  },
  resetPasswordOtp: {
    label: 'Password reset OTP',
    subject: (d) => `${d.otp} is your Beyond Brawn password reset code`,
    body: (d) => h1('Reset your password') + p(`Hi ${first(d.name)}, use this code to set a new password.`) + otpBox(d.otp) + p(`The code is valid for ${d.ttl} minutes.`) + small('Did not ask for this? Your password is unchanged and you can ignore this email.'),
  },
  orderConfirmation: {
    label: 'Order confirmation',
    subject: (d) => `Order ${d.order.orderNumber} confirmed`,
    body: (d) => h1('Order confirmed') + p(`Thanks ${orderName(d.order)}. We have your order <strong>${esc(d.order.orderNumber)}</strong> and are getting it ready.`) + itemsTable(d.order) + addressBlock(d.order.shippingAddress) + button('View order', orderLink(d.order)),
  },
  paymentSuccess: {
    label: 'Payment successful',
    subject: (d) => `Payment received for order ${d.order.orderNumber}`,
    body: (d) => h1('Payment received') + p(`We received <strong>${formatINR(d.order.pricing.total)}</strong> for order <strong>${esc(d.order.orderNumber)}</strong>.`) + p(`Payment ID: ${esc(d.paymentId || '')}${d.method ? `<br>Method: ${esc(d.method)}` : ''}`) + button('View order', orderLink(d.order)),
  },
  paymentFailed: {
    label: 'Payment failed',
    subject: (d) => `Payment failed for order ${d.order.orderNumber}`,
    body: (d) => h1('Payment did not go through') + p(`Your payment of <strong>${formatINR(d.order.pricing.total)}</strong> for order <strong>${esc(d.order.orderNumber)}</strong> failed, so the order was not placed.`) + p('If money left your account, your bank will reverse it automatically, usually within 5 to 7 working days.') + button('Try again', '/cart'),
  },
  orderProcessing: {
    label: 'Order processing',
    subject: (d) => `Order ${d.order.orderNumber} is being prepared`,
    body: (d) => h1('We are packing your order') + p(`Hi ${orderName(d.order)}, order <strong>${esc(d.order.orderNumber)}</strong> is being picked and packed. You will get another email when it ships.`) + button('View order', orderLink(d.order)),
  },
  orderShipped: {
    label: 'Order shipped',
    subject: (d) => `Order ${d.order.orderNumber} has shipped`,
    body: (d) => h1('Your order is on its way') + p(`Hi ${orderName(d.order)}, order <strong>${esc(d.order.orderNumber)}</strong> has left our warehouse.`) + trackingBlock(d.order) + addressBlock(d.order.shippingAddress) + button('Track order', orderLink(d.order)),
  },
  outForDelivery: {
    label: 'Out for delivery',
    subject: (d) => `Order ${d.order.orderNumber} is out for delivery`,
    body: (d) => h1('Arriving today') + p(`Hi ${orderName(d.order)}, order <strong>${esc(d.order.orderNumber)}</strong> is out for delivery. Keep your phone reachable for the delivery partner.`) + trackingBlock(d.order) + button('Track order', orderLink(d.order)),
  },
  orderDelivered: {
    label: 'Order delivered',
    subject: (d) => `Order ${d.order.orderNumber} delivered`,
    body: (d) => h1('Delivered') + p(`Hi ${orderName(d.order)}, order <strong>${esc(d.order.orderNumber)}</strong> has been delivered.`) + p('Once you have tried it, a short review helps other lifters choose well.') + button(d.order.isGuest ? 'Shop again' : 'Review your products', d.order.isGuest ? '/shop' : orderLink(d.order)),
  },
  orderCancelled: {
    label: 'Order cancelled',
    subject: (d) => `Order ${d.order.orderNumber} cancelled`,
    body: (d) => h1('Order cancelled') + p(`Order <strong>${esc(d.order.orderNumber)}</strong> has been cancelled.${d.order.cancelReason ? ` Reason: ${esc(d.order.cancelReason)}.` : ''}`) + (d.refundExpected ? p(`A refund of <strong>${formatINR(d.order.pricing.total)}</strong> will be sent to your original payment method.`) : '') + button('Continue shopping', '/shop'),
  },
  refundInitiated: {
    label: 'Refund initiated',
    subject: (d) => `Refund initiated for order ${d.order.orderNumber}`,
    body: (d) => h1('Refund initiated') + p(`We have started a refund of <strong>${formatINR(d.amount)}</strong> for order <strong>${esc(d.order.orderNumber)}</strong>.`) + p('It reaches your original payment method in 5 to 7 working days, depending on your bank.') + button('View order', orderLink(d.order)),
  },
  refundCompleted: {
    label: 'Refund completed',
    subject: (d) => `Refund completed for order ${d.order.orderNumber}`,
    body: (d) => h1('Refund completed') + p(`Your refund of <strong>${formatINR(d.amount)}</strong> for order <strong>${esc(d.order.orderNumber)}</strong> has been processed.`) + p('If it is not visible yet, check with your bank using the order number as reference.'),
  },
  contactNotification: {
    label: 'Contact form notification (admin)',
    subject: (d) => `New contact message: ${d.subject || d.name}`,
    body: (d) => h1('New contact message') + p(`<strong>${esc(d.name)}</strong> (${esc(d.email)}${d.phone ? `, ${esc(d.phone)}` : ''})`) + (d.subject ? p(`<strong>Subject:</strong> ${esc(d.subject)}`) : '') + p(esc(d.message).replace(/\n/g, '<br>')) + button('Open messages', '/admin/content/messages'),
  },
  adminNewOrder: {
    label: 'New order notification (admin)',
    subject: (d) => `New order ${d.order.orderNumber} (${formatINR(d.order.pricing.total)})`,
    body: (d) => h1('New paid order') + p(`<strong>${esc(d.order.orderNumber)}</strong> from ${esc(d.order.customer.name)} (${esc(d.order.customer.email)}, ${esc(d.order.customer.phone || '')})`) + itemsTable(d.order) + addressBlock(d.order.shippingAddress) + button('Open in admin', `/admin/orders/${d.order._id}`),
  },
};

const sampleOrder = {
  _id: '000000000000000000000000',
  orderNumber: 'BB-2026-000001',
  isGuest: false,
  customer: { name: 'Rohan Mehta', email: 'rohan@example.com', phone: '9876543210' },
  items: [
    { name: 'Brawn Whey Protein', variantLabel: 'Double Chocolate / 1 kg', quantity: 1, lineTotal: 2199 },
    { name: 'Creatine Monohydrate', variantLabel: '250 g', quantity: 2, lineTotal: 1398 },
  ],
  pricing: { subtotal: 3597, couponDiscount: 200, shipping: 0, tax: 518.24, taxInclusive: true, total: 3397 },
  coupon: { code: 'BRAWN200' },
  shippingAddress: { fullName: 'Rohan Mehta', phone: '9876543210', line1: '42 Sector 15', line2: '', city: 'Faridabad', state: 'Haryana', pincode: '121007' },
  tracking: { carrier: 'Delhivery', trackingNumber: 'DL123456789IN', trackingUrl: 'https://www.delhivery.com/track' },
  cancelReason: 'Requested by customer',
};
const SAMPLE = { name: 'Rohan Mehta', email: 'rohan@example.com', phone: '9876543210', otp: '482913', ttl: 10, order: sampleOrder, amount: 3397, paymentId: 'pay_SampleId123', method: 'upi', refundExpected: true, subject: 'Bulk order enquiry', message: 'Do you offer gym pricing on 20+ tubs?' };

function render(key, data = {}, brand = {}) {
  const t = TEMPLATES[key];
  if (!t) throw new Error(`Unknown email template: ${key}`);
  const override = brand.emailTemplates && brand.emailTemplates[key] && brand.emailTemplates[key].subject;
  const subject = override ? override.replace(/\{\{\s*orderNumber\s*\}\}/g, (data.order && data.order.orderNumber) || '').replace(/\{\{\s*otp\s*\}\}/g, data.otp || '') : t.subject(data);
  return { subject, html: layout({ title: subject, preheader: subject, body: t.body(data), brand }) };
}

const list = () => Object.entries(TEMPLATES).map(([key, t]) => ({ key, label: t.label, defaultSubject: t.subject(SAMPLE) }));

module.exports = { TEMPLATES, SAMPLE, render, list };
