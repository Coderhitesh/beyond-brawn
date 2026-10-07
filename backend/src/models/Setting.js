const { Schema, model } = require('mongoose');
// One document per settings group (general, shipping, tax, seo ...)
module.exports = model('Setting', new Schema({ key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed, default: {} } }, { timestamps: true, minimize: false }));
