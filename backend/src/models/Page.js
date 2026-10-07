const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');
// CMS pages: about, privacy-policy, terms, refund-policy, shipping-policy, return-policy
module.exports = model(
  'Page',
  new Schema({ slug: { type: String, required: true, unique: true }, title: { type: String, required: true }, content: String, isActive: { type: Boolean, default: true }, seo: seoSchema }, { timestamps: true })
);
