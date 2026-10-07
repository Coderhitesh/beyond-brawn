const { Schema, model } = require('mongoose');
// Stock movement ledger. Current stock lives on Product / ProductVariant; every change is recorded here.
const schema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    sku: String,
    type: { type: String, enum: ['initial', 'restock', 'adjustment', 'reserve', 'release', 'return'], required: true },
    quantity: { type: Number, required: true }, // signed
    stockBefore: Number,
    stockAfter: Number,
    note: String,
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    admin: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);
schema.index({ createdAt: -1 });
module.exports = model('Inventory', schema);
