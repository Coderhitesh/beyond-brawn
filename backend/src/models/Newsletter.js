const { Schema, model } = require('mongoose');
module.exports = model(
  'Newsletter',
  new Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true }, isSubscribed: { type: Boolean, default: true }, source: { type: String, default: 'website' } }, { timestamps: true })
);
