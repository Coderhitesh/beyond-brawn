const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/respond');
const tokens = require('../utils/tokens');
const { User, Cart } = require('../models');
const otpService = require('../services/otp.service');
const email = require('../services/email.service');
const { notifyAdmin } = require('../services/notification.service');

const OTP_TEMPLATE = { verify_email: 'verifyEmailOtp', reset_password: 'resetPasswordOtp' };

async function sendOtp(user, purpose) {
  const { otp, ttl, resendIn } = await otpService.issue(user.email, purpose);
  try {
    await email.send(OTP_TEMPLATE[purpose], user.email, { name: user.name, otp, ttl });
  } catch (e) {
    throw new ApiError(502, 'We could not send the OTP email. Try again in a moment.', null, 'EMAIL_FAILED');
  }
  return { resendIn, ttl };
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email: mail, phone, password } = req.body;
  let user = await User.findOne({ email: mail }).select('+password');
  if (user && user.isEmailVerified) throw new ApiError(409, 'An account with this email already exists. Log in instead.', null, 'EMAIL_TAKEN');
  if (user) {
    // Unverified sign-up being retried: refresh the details.
    Object.assign(user, { name, phone, password });
    await user.save();
  } else {
    user = await User.create({ name, email: mail, phone, password });
  }
  const meta = await sendOtp(user, 'verify_email');
  created(res, { email: user.email, ...meta }, 'We sent a 6-digit code to your email');
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(400, 'This OTP has expired. Request a new one.', null, 'OTP_EXPIRED');
  if (!user.isActive) throw new ApiError(403, 'This account is disabled. Contact support.', null, 'ACCOUNT_DISABLED');
  const firstTime = !user.isEmailVerified;
  if (firstTime) {
    await otpService.verify(user.email, 'verify_email', req.body.otp);
    user.isEmailVerified = true;
  }
  user.lastLoginAt = new Date();
  await user.save();
  if (firstTime) {
    await Cart.updateOne({ user: user._id }, { $setOnInsert: { items: [] } }, { upsert: true });
    email.queue('welcome', user.email, { name: user.name });
    notifyAdmin('new_customer', 'New customer', `${user.name} (${user.email}) signed up`, `/admin/customers/${user._id}`);
    tokens.setAuthCookie(res, 'customer', user);
    return ok(res, { user: user.toSafe() }, 'Email verified');
  }
  // Already verified: do not log in from this endpoint (would bypass the password).
  return ok(res, {}, 'Email already verified. Log in to continue.');
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const { email: mail, purpose } = req.body;
  const user = await User.findOne({ email: mail });
  const generic = 'If that email is registered, a new code is on its way';
  if (!user || !user.isActive || (purpose === 'verify_email' && user.isEmailVerified)) return ok(res, {}, generic);
  const meta = await sendOtp(user, purpose);
  return ok(res, meta, generic);
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError(401, 'Incorrect email or password', null, 'INVALID_CREDENTIALS');
  if (!user.isActive) throw new ApiError(403, 'This account is disabled. Contact support.', null, 'ACCOUNT_DISABLED');
  if (!user.isEmailVerified) {
    let meta = {};
    try {
      meta = await sendOtp(user, 'verify_email');
    } catch (e) {
      if (e.status !== 429) throw e; // a code was sent recently; let them enter it
    }
    throw new ApiError(403, 'Verify your email to continue. We sent you a code.', { email: user.email, ...meta }, 'EMAIL_NOT_VERIFIED');
  }
  user.lastLoginAt = new Date();
  await user.save();
  tokens.setAuthCookie(res, 'customer', user);
  ok(res, { user: user.toSafe() }, 'Logged in');
});

exports.logout = asyncHandler(async (req, res) => {
  tokens.clearAuthCookie(res, 'customer');
  ok(res, {}, 'Logged out');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const generic = 'If that email is registered, a reset code is on its way';
  if (!user || !user.isActive) return ok(res, {}, generic);
  try {
    const meta = await sendOtp(user, 'reset_password');
    return ok(res, meta, generic);
  } catch (e) {
    if (e.status === 429) throw e;
    return ok(res, {}, generic);
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email: mail, otp, password } = req.body;
  const user = await User.findOne({ email: mail }).select('+password');
  if (!user || !user.isActive) throw new ApiError(400, 'This OTP has expired. Request a new one.', null, 'OTP_EXPIRED');
  await otpService.verify(user.email, 'reset_password', otp);
  user.password = password;
  user.isEmailVerified = true; // they proved ownership of the inbox
  user.tokenVersion += 1; // signs out every existing session
  await user.save();
  tokens.clearAuthCookie(res, 'customer');
  ok(res, {}, 'Password updated. Log in with your new password.');
});

exports.me = asyncHandler(async (req, res) => ok(res, { user: req.user ? req.user.toSafe() : null }));

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect', null, 'INVALID_CREDENTIALS');
  user.password = req.body.newPassword;
  user.tokenVersion += 1;
  await user.save();
  tokens.setAuthCookie(res, 'customer', user); // keep this device signed in, sign out the rest
  ok(res, {}, 'Password changed');
});
