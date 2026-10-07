const { Schema, model } = require('mongoose');
const schema = new Schema({ term: { type: String, required: true, unique: true, lowercase: true, trim: true }, count: { type: Number, default: 1 } }, { timestamps: true });
schema.index({ count: -1 });
module.exports = model('SearchTerm', schema);
