const { Schema, model } = require('mongoose');
module.exports = model(
  'Brand',
  new Schema(
    { name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true }, logo: String, description: String, isActive: { type: Boolean, default: true } },
    { timestamps: true }
  )
);
