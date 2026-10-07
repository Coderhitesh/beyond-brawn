const { Schema, model } = require('mongoose');
// Price snapshot of a purchased line. Never recalculated after the order is created.
const schema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    name: { type: String, required: true },
    slug: String,
    sku: String,
    image: String,
    variantLabel: String,
    mrp: { type: Number, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
    gstRate: { type: Number, default: 18 },
  },
  { timestamps: true }
);
schema.index({ user: 1, product: 1 });
module.exports = model('OrderItem', schema);
