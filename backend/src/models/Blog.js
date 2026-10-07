const { Schema, model } = require('mongoose');
const { seoSchema } = require('./_shared');
const schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, maxlength: 400 },
    content: String, // sanitised HTML
    coverImage: String,
    category: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
    author: { type: String, default: 'Team Beyond Brawn' },
    tags: [String],
    readMinutes: { type: Number, default: 4 },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: Date,
    seo: seoSchema,
  },
  { timestamps: true }
);
schema.index({ isPublished: 1, publishedAt: -1 });
schema.index({ createdAt: -1 });
module.exports = model('Blog', schema);
