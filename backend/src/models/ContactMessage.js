const { Schema, model } = require('mongoose');
module.exports = model(
  'ContactMessage',
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: String,
      subject: String,
      message: { type: String, required: true, maxlength: 4000 },
      status: { type: String, enum: ['new', 'read', 'replied'], default: 'new', index: true },
    },
    { timestamps: true }
  )
);
