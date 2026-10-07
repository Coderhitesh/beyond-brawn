const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    image: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    seo: seoSchema,
  },
  { timestamps: true }
);
schema.index({ isActive: 1, sortOrder: 1 });
module.exports = model('Category', schema);
