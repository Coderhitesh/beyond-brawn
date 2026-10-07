const { Schema, model } = require('mongoose');
module.exports = model(
  'Permission',
  new Schema({ key: { type: String, required: true, unique: true }, label: { type: String, required: true }, group: { type: String, required: true } }, { timestamps: true })
);
