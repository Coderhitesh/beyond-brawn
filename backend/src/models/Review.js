const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, trim: true, maxlength: 2000 },
    images: [String],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    isVerifiedPurchase: { type: Boolean, default: true },
  },
  { timestamps: true }
);
schema.index({ product: 1, user: 1 }, { unique: true });
schema.index({ createdAt: -1 });
module.exports = model('Review', schema);
