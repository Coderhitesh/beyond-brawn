const { Schema, model } = require('mongoose');
const schema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ['verify_email', 'reset_password', 'sensitive_action'], required: true },
    otpHash: { type: String, default: null }, // HMAC-SHA256, never the raw OTP
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
    sendCount: { type: Number, default: 0 },
    windowStart: Date,
    lastSentAt: Date,
    purgeAt: { type: Date, index: { expires: 0 } }, // TTL clean-up
  },
  { timestamps: true }
);
schema.index({ email: 1, purpose: 1 }, { unique: true });
module.exports = model('EmailOTP', schema);
