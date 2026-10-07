const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIES = { customer: 'bb_token', admin: 'bb_admin' };

const ms = (str) => {
  const m = /^(\d+)([smhd])$/.exec(str);
  if (!m) return 7 * 864e5;
  return Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
};

function sign(kind, account) {
  const admin = kind === 'admin';
  return jwt.sign({ sub: String(account._id), tv: account.tokenVersion || 0, typ: kind }, admin ? env.jwt.adminSecret : env.jwt.secret, {
    expiresIn: admin ? env.jwt.adminExpiresIn : env.jwt.expiresIn,
  });
}
function verify(kind, token) {
  const payload = jwt.verify(token, kind === 'admin' ? env.jwt.adminSecret : env.jwt.secret);
  if (payload.typ !== kind) throw new jwt.JsonWebTokenError('Wrong token type');
  return payload;
}
const cookieOptions = (kind) => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: '/',
  maxAge: ms(kind === 'admin' ? env.jwt.adminExpiresIn : env.jwt.expiresIn),
});
function setAuthCookie(res, kind, account) {
  const token = sign(kind, account);
  res.cookie(COOKIES[kind], token, cookieOptions(kind));
  return token;
}
function clearAuthCookie(res, kind) {
  const { maxAge, ...opts } = cookieOptions(kind);
  res.clearCookie(COOKIES[kind], opts);
}
// Cookie first; Bearer header as fallback (used by the Next.js server when forwarding).
function readToken(req, kind) {
  const fromCookie = req.cookies && req.cookies[COOKIES[kind]];
  if (fromCookie) return fromCookie;
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

/*
 * Rolling session: once a cookie session is past half its lifetime, any authenticated request renews it.
 * Active users stay signed in; an account idle for the full lifetime (customer 7d, admin 12h by default) is signed out.
 * Revocation is unchanged: tokenVersion still invalidates every session on password change, block or role change.
 */
function renewIfStale(req, res, kind, payload, account) {
  if (!(req.cookies && req.cookies[COOKIES[kind]]) || !payload.exp || !payload.iat) return;
  const now = Math.floor(Date.now() / 1000);
  if (now - payload.iat > (payload.exp - payload.iat) / 2) setAuthCookie(res, kind, account);
}

module.exports = { COOKIES, sign, verify, setAuthCookie, clearAuthCookie, readToken, renewIfStale };
