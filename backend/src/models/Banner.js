const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: String,
    image: String,
    mobileImage: String,
    link: String,
    buttonText: String,
    placement: { type: String, enum: ['hero', 'promo', 'category', 'offer'], default: 'hero', index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);
module.exports = model('Banner', schema);
