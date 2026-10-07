const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    audience: { type: String, enum: ['customer', 'admin'], required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: { type: String, required: true }, // order_placed, payment_success, order_shipped, low_stock, new_review ...
    title: { type: String, required: true },
    message: String,
    link: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
schema.index({ audience: 1, isRead: 1, createdAt: -1 });
module.exports = model('Notification', schema);
