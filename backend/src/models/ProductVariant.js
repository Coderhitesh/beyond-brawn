const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    options: { type: Map, of: String, default: {} }, // { Flavor: 'Chocolate', Size: '1 kg' }
    label: { type: String, trim: true }, // "Chocolate / 1 kg"
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0, select: false },
    stock: { type: Number, default: 0, min: 0 },
    image: String,
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true, flattenMaps: true }, toObject: { virtuals: true, flattenMaps: true } }
);
module.exports = model('ProductVariant', schema);
