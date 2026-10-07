const { Schema, model } = require('mongoose');
module.exports = model(
  'Wishlist',
  new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, products: [{ type: Schema.Types.ObjectId, ref: 'Product' }] }, { timestamps: true })
);
