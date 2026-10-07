const { Schema, model } = require('mongoose');
const fields = {
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  country: { type: String, default: 'India', trim: true },
};
const schema = new Schema(
  { user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, ...fields, label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' }, isDefault: { type: Boolean, default: false } },
  { timestamps: true }
);
module.exports = model('Address', schema);
module.exports.addressFields = fields;
