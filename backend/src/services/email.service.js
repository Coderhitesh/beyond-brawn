const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');
const settings = require('./settings.service');
const templates = require('../templates');

let transporter = null;
const configured = Boolean(env.smtp.host);

function getTransporter() {
  if (!configured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
      pool: true,
    });
  }
  return transporter;
}

async function sendRaw({ to, subject, html, replyTo }) {
  const t = getTransporter();
  if (!t) {
    if (env.isProd) throw new Error('SMTP is not configured');
    // Development fallback so OTP flows work without an SMTP account.
    const text = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    logger.info(`[email:dev] to=${to} | ${subject}\n        ${text.slice(0, 400)}`);
    return { dev: true };
  }
  return t.sendMail({ from: env.smtp.from, to, subject, html, replyTo });
}

// Awaitable: use for OTP mails where the caller must know about failures.
async function send(key, to, data = {}, opts = {}) {
  const all = await settings.getAll();
  const { subject, html } = templates.render(key, data, all);
  return sendRaw({ to, subject, html, ...opts });
}

// Fire-and-forget: order/status mails must never break the request that triggered them.
function queue(key, to, data = {}, opts = {}) {
  if (!to) return;
  send(key, to, data, opts).catch((e) => logger.error(`Email "${key}" to ${to} failed:`, e.message));
}

async function adminRecipient() {
  if (env.smtp.adminNotify) return env.smtp.adminNotify;
  const contact = await settings.get('contact');
  return contact.email;
}

async function verifyConnection() {
  const t = getTransporter();
  if (!t) return { ok: false, message: 'SMTP_HOST is not set' };
  try {
    await t.verify();
    return { ok: true, message: 'SMTP connection OK' };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

module.exports = { send, queue, sendRaw, adminRecipient, verifyConnection, configured };
