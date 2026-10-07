const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
        quantity: { type: Number, required: true, min: 1, max: 20 },
      },
    ],
    couponCode: { type: String, uppercase: true, trim: true, default: null },
  },
  { timestamps: true }
);
module.exports = model('Cart', schema);
