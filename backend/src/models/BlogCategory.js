const { Schema, model } = require('mongoose');
module.exports = model('BlogCategory', new Schema({ name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true } }, { timestamps: true }));
