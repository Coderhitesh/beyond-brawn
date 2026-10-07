const { Schema, model } = require('mongoose');
// Reusable variant attributes, e.g. Flavor: [Chocolate, Vanilla], Size: [1 kg, 2 kg]
module.exports = model(
  'Attribute',
  new Schema({ name: { type: String, required: true, trim: true, unique: true }, slug: { type: String, required: true, unique: true }, values: [{ type: String, trim: true }] }, { timestamps: true })
);
