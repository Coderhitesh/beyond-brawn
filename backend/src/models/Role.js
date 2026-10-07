const { Schema, model } = require('mongoose');
module.exports = model(
  'Role',
  new Schema(
    {
      name: { type: String, required: true, trim: true, unique: true },
      slug: { type: String, required: true, unique: true },
      description: String,
      permissions: [{ type: String }], // Permission.key values
      isSystem: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);
