const { Schema, model } = require('mongoose');
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('./_shared');
const { addressFields } = require('./Address');

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isGuest: { type: Boolean, default: false },
    customer: { name: String, email: { type: String, lowercase: true, trim: true }, phone: String },
    items: [{ type: Schema.Types.ObjectId, ref: 'OrderItem' }],
    itemCount: { type: Number, default: 0 },
    shippingAddress: new Schema(addressFields, { _id: false }),
    shippingMethod: { code: String, name: String, minDays: Number, maxDays: Number },
    pricing: {
      mrpTotal: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      productDiscount: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      taxInclusive: { type: Boolean, default: true },
      total: { type: Number, default: 0 },
    },
    coupon: { code: String, id: { type: Schema.Types.ObjectId, ref: 'Coupon' } },
    status: { type: String, enum: ORDER_STATUSES, default: 'Pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    paymentMethod: String,
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    razorpayOrderId: { type: String, index: true },
    tracking: { carrier: String, trackingNumber: String, trackingUrl: String },
    statusHistory: [{ _id: false, status: String, note: String, at: { type: Date, default: Date.now }, by: String }],
    cartHash: { type: String, index: true },
    stockReserved: { type: Boolean, default: false },
    fromCart: { type: Boolean, default: true }, // false for Buy Now, so the cart is left untouched
    notes: String,
    placedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    expiresAt: Date, // unpaid orders release their stock after this
  },
  { timestamps: true }
);
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ paymentStatus: 1, placedAt: -1 });

module.exports = model('Order', orderSchema);
