const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const tokens = require('../utils/tokens');
const { User, Admin } = require('../models');

async function loadCustomer(req, res) {
  const token = tokens.readToken(req, 'customer');
  if (!token) return null;
  const payload = tokens.verify('customer', token);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || (user.tokenVersion || 0) !== (payload.tv || 0)) return null;
  if (user.isEmailVerified) tokens.renewIfStale(req, res, 'customer', payload, user);
  return user;
}

const protect = asyncHandler(async (req, res, next) => {
  const user = await loadCustomer(req, res);
  if (!user) throw new ApiError(401, 'Log in to continue', null, 'UNAUTHENTICATED');
  if (!user.isEmailVerified) throw new ApiError(403, 'Verify your email to continue', null, 'EMAIL_NOT_VERIFIED');
  req.user = user;
  next();
});

// Attaches req.user when a valid session exists; never rejects (guest checkout, public pages).
const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const user = await loadCustomer(req, res);
    if (user && user.isEmailVerified) req.user = user;
  } catch (e) {
    /* treat as guest */
  }
  next();
});

const protectAdmin = asyncHandler(async (req, res, next) => {
  const token = tokens.readToken(req, 'admin');
  if (!token) throw new ApiError(401, 'Admin login required', null, 'UNAUTHENTICATED');
  const payload = tokens.verify('admin', token);
  const admin = await Admin.findById(payload.sub).populate('role');
  if (!admin || !admin.isActive || (admin.tokenVersion || 0) !== (payload.tv || 0)) {
    throw new ApiError(401, 'Admin login required', null, 'UNAUTHENTICATED');
  }
  tokens.renewIfStale(req, res, 'admin', payload, admin);
  req.admin = admin;
  req.adminPermissions = new Set((admin.role && admin.role.permissions) || []);
  next();
});

// can('orders.manage') or can('products.view', 'products.manage') (any of)
const can = (...keys) => (req, res, next) => {
  if (req.admin && (req.admin.isSuperAdmin || keys.some((k) => req.adminPermissions.has(k)))) return next();
  return next(new ApiError(403, 'You do not have permission to do this', { required: keys }, 'FORBIDDEN'));
};

module.exports = { protect, optionalAuth, protectAdmin, can };
