const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    code: String,
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, lowercase: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    discount: Number,
  },
  { timestamps: true }
);
schema.index({ coupon: 1, user: 1 });
schema.index({ coupon: 1, email: 1 });
module.exports = model('CouponUsage', schema);
