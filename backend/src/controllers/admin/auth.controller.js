const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { ok } = require('../../utils/respond');
const tokens = require('../../utils/tokens');
const { Admin } = require('../../models');
const { ALL_PERMISSIONS } = require('../../config/permissions');

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

const shape = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  isSuperAdmin: admin.isSuperAdmin,
  role: admin.role ? { id: admin.role._id, name: admin.role.name } : null,
  permissions: admin.isSuperAdmin ? ALL_PERMISSIONS : (admin.role && admin.role.permissions) || [],
});

exports.login = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({ email: req.body.email }).select('+password').populate('role');
  const invalid = new ApiError(401, 'Incorrect email or password', null, 'INVALID_CREDENTIALS');
  if (!admin) throw invalid;
  if (admin.lockedUntil && admin.lockedUntil > new Date()) throw new ApiError(423, `Account locked after too many attempts. Try again in ${LOCK_MINUTES} minutes.`, null, 'ACCOUNT_LOCKED');
  if (!(await admin.comparePassword(req.body.password))) {
    admin.failedLogins += 1;
    if (admin.failedLogins >= MAX_FAILS) {
      admin.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      admin.failedLogins = 0;
    }
    await admin.save();
    throw invalid;
  }
  if (!admin.isActive) throw new ApiError(403, 'This admin account is disabled', null, 'ACCOUNT_DISABLED');
  admin.failedLogins = 0;
  admin.lockedUntil = undefined;
  admin.lastLoginAt = new Date();
  await admin.save();
  tokens.setAuthCookie(res, 'admin', admin);
  ok(res, { admin: shape(admin) }, 'Logged in');
});

exports.logout = asyncHandler(async (req, res) => {
  tokens.clearAuthCookie(res, 'admin');
  ok(res, {}, 'Logged out');
});

exports.me = asyncHandler(async (req, res) => ok(res, { admin: shape(req.admin) }));

exports.changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!(await admin.comparePassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  admin.password = req.body.newPassword;
  admin.tokenVersion += 1;
  await admin.save();
  tokens.setAuthCookie(res, 'admin', admin);
  ok(res, {}, 'Password changed');
});
