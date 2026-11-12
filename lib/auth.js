// Password-only admin auth. No username. Login is disabled until ADMIN_PASSWORD is set.
const crypto = require('crypto');

const COOKIE = 'eb_admin';
const MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12 hours
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

function makeToken() {
  const exp = String(Date.now() + MAX_AGE_MS);
  return `${exp}.${sign(exp)}`;
}

function readCookie(req) {
  const raw = req.headers.cookie || '';
  const match = raw.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : null;
}

function isAuthed(req) {
  const token = readCookie(req);
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

function loginEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function checkPassword(pw) {
  return loginEnabled() && typeof pw === 'string' && safeEqual(pw, process.env.ADMIN_PASSWORD);
}

function setSession(res, req) {
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(makeToken())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_MS / 1000}${secure}`);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: 'Not signed in' });
}

module.exports = { isAuthed, loginEnabled, checkPassword, setSession, clearSession, requireAuth };
