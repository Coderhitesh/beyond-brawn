const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message, error: { code: 'RATE_LIMITED' } }),
  });

module.exports = {
  // The Next.js server shares one IP for SSR requests, so the global ceiling is generous and configurable.
  global: make(15, env.rateLimitMax, 'Too many requests. Slow down and try again shortly.'),
  auth: make(15, 30, 'Too many attempts. Try again in 15 minutes.'),
  otp: make(15, 10, 'Too many OTP requests. Try again in 15 minutes.'),
  adminLogin: make(15, 10, 'Too many login attempts. Try again in 15 minutes.'),
  forms: make(60, 10, 'Too many submissions. Try again later.'),
  checkout: make(15, 30, 'Too many checkout attempts. Try again shortly.'),
  search: make(1, 120, 'Too many searches. Slow down.'),
};
