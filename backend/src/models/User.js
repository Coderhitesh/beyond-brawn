const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true }
);
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text', phone: 'text' });

userSchema.pre('save', async function hash(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});
userSchema.methods.comparePassword = function compare(plain) {
  return bcrypt.compare(plain, this.password);
};
userSchema.methods.toSafe = function toSafe() {
  return { id: this._id, name: this.name, email: this.email, phone: this.phone, isEmailVerified: this.isEmailVerified, createdAt: this.createdAt };
};

module.exports = model('User', userSchema);
