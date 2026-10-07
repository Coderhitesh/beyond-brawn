const { Schema } = require('mongoose');

const seoSchema = new Schema(
  { title: { type: String, trim: true, maxlength: 160 }, description: { type: String, trim: true, maxlength: 320 }, keywords: { type: String, trim: true, maxlength: 320 } },
  { _id: false }
);
const imageSchema = new Schema({ url: { type: String, required: true }, publicId: String, alt: String }, { _id: false });

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Failed', 'Refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refund_initiated', 'refunded'];
const GOALS = ['muscle-gain', 'strength', 'recovery', 'energy', 'weight-management', 'general-wellness'];

module.exports = { seoSchema, imageSchema, ORDER_STATUSES, PAYMENT_STATUSES, GOALS };
