const router = require('express').Router();
const c = require('../controllers/auth.controller');
const v = require('../validators/auth');
const validate = require('../middlewares/validate');
const { protect, optionalAuth } = require('../middlewares/auth');
const limit = require('../middlewares/rateLimiters');

router.post('/register', limit.auth, validate({ body: v.register }), c.register);
router.post('/verify-email', limit.auth, validate({ body: v.verifyEmail }), c.verifyEmail);
router.post('/resend-otp', limit.otp, validate({ body: v.resendOtp }), c.resendOtp);
router.post('/login', limit.auth, validate({ body: v.login }), c.login);
router.post('/logout', c.logout);
router.post('/forgot-password', limit.otp, validate({ body: v.forgotPassword }), c.forgotPassword);
router.post('/reset-password', limit.auth, validate({ body: v.resetPassword }), c.resetPassword);
router.get('/me', optionalAuth, c.me);
router.post('/change-password', protect, limit.auth, validate({ body: v.changePassword }), c.changePassword);

module.exports = router;
