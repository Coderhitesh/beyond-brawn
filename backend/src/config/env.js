require('dotenv').config();

const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required');
if (isProd && jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

module.exports = {
  nodeEnv,
  isProd,
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI,
  clientUrls,
  clientUrl: clientUrls[0],
  apiPublicUrl: (process.env.API_PUBLIC_URL || `http://localhost:${num(process.env.PORT, 5000)}`).replace(/\/$/, ''),
  trustProxy: num(process.env.TRUST_PROXY, 0),
  rateLimitMax: num(process.env.RATE_LIMIT_MAX, 1500),
  jwt: {
    secret: jwtSecret,
    adminSecret: process.env.JWT_ADMIN_SECRET || `${jwtSecret}:admin`,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '12h',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    sameSite,
    secure: isProd || sameSite === 'none',
  },
  otp: {
    ttlMinutes: num(process.env.OTP_TTL_MINUTES, 10),
    maxAttempts: num(process.env.OTP_MAX_ATTEMPTS, 5),
    resendCooldownSeconds: num(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
    maxSendsPerHour: num(process.env.OTP_MAX_SENDS_PER_HOUR, 5),
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'Beyond Brawn <no-reply@beyondbrawn.in>',
    adminNotify: process.env.ADMIN_NOTIFY_EMAIL || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'beyond-brawn',
  },
  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@beyondbrawn.in',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
};
