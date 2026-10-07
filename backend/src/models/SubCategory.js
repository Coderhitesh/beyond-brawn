const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    description: String,
    image: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seo: seoSchema,
  },
  { timestamps: true }
);
module.exports = model('SubCategory', schema);
