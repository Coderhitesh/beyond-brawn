const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { hmac, safeEqual } = require('../utils/helpers');
const { EmailOTP } = require('../models');

const HOUR = 60 * 60 * 1000;
const hashOtp = (email, purpose, otp) => hmac(`${email}|${purpose}|${otp}`, env.jwt.secret);

// Creates a fresh 6-digit OTP. Enforces resend cooldown and an hourly send cap per email+purpose.
async function issue(email, purpose) {
  const now = Date.now();
  const rec = await EmailOTP.findOne({ email, purpose });

  if (rec && rec.lastSentAt) {
    const wait = env.otp.resendCooldownSeconds * 1000 - (now - rec.lastSentAt.getTime());
    if (wait > 0) {
      const seconds = Math.ceil(wait / 1000);
      throw new ApiError(429, `Wait ${seconds}s before requesting another OTP`, { retryAfter: seconds }, 'OTP_COOLDOWN');
    }
  }
  const inWindow = rec && rec.windowStart && now - rec.windowStart.getTime() < HOUR;
  if (inWindow && rec.sendCount >= env.otp.maxSendsPerHour) {
    throw new ApiError(429, 'Too many OTP requests. Try again in an hour.', null, 'OTP_LIMIT');
  }

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await EmailOTP.findOneAndUpdate(
    { email, purpose },
    {
      otpHash: hashOtp(email, purpose, otp),
      expiresAt: new Date(now + env.otp.ttlMinutes * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date(now),
      sendCount: inWindow ? rec.sendCount + 1 : 1,
      windowStart: inWindow ? rec.windowStart : new Date(now),
      purgeAt: new Date(now + 2 * HOUR),
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return { otp, ttl: env.otp.ttlMinutes, resendIn: env.otp.resendCooldownSeconds };
}

// Throws on any failure. A correct OTP is single-use.
async function verify(email, purpose, otp) {
  const rec = await EmailOTP.findOne({ email, purpose });
  if (!rec || !rec.otpHash || !rec.expiresAt || rec.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'This OTP has expired. Request a new one.', null, 'OTP_EXPIRED');
  }
  if (rec.attempts >= env.otp.maxAttempts) {
    throw new ApiError(429, 'Too many wrong attempts. Request a new OTP.', null, 'OTP_LOCKED');
  }
  if (!safeEqual(rec.otpHash, hashOtp(email, purpose, otp))) {
    rec.attempts += 1;
    await rec.save();
    const left = env.otp.maxAttempts - rec.attempts;
    throw new ApiError(400, left > 0 ? `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect OTP. Request a new one.', { attemptsLeft: left }, 'OTP_INVALID');
  }
  rec.otpHash = null; // consume; keep the record so the send-rate window survives
  rec.expiresAt = null;
  await rec.save();
  return true;
}

module.exports = { issue, verify };
