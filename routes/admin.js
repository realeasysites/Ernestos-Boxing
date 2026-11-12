const path = require('path');
const express = require('express');
const db = require('../lib/db');
const auth = require('../lib/auth');

const router = express.Router();
const adminDir = path.join(__dirname, '..', 'public', 'admin');

// Every /admin page view goes through here first.
router.get(['/admin', '/admin/', '/admin/index.html'], (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(adminDir, auth.isAuthed(req) ? 'index.html' : 'login.html'));
});

router.get('/api/admin/status', (req, res) => {
  res.json({ authed: auth.isAuthed(req), loginEnabled: auth.loginEnabled() });
});

const attempts = new Map();
router.post('/api/admin/login', (req, res) => {
  const now = Date.now();
  const recent = (attempts.get(req.ip) || []).filter(t => now - t < 15 * 60 * 1000);
  if (recent.length >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  if (!auth.loginEnabled()) return res.status(503).json({ error: 'Login is disabled until ADMIN_PASSWORD is set.' });
  if (!auth.checkPassword((req.body || {}).password)) {
    recent.push(now);
    attempts.set(req.ip, recent);
    return res.status(401).json({ error: 'Wrong password.' });
  }
  attempts.delete(req.ip);
  auth.setSession(res, req);
  res.json({ ok: true });
});

router.post('/api/admin/logout', (req, res) => {
  auth.clearSession(res);
  res.json({ ok: true });
});

router.get('/api/admin/signups', auth.requireAuth, (req, res) => {
  res.json({ signups: db.listSignups(), statuses: db.STATUSES });
});

router.patch('/api/admin/signups/:id', auth.requireAuth, (req, res) => {
  const row = db.updateSignup(Number(req.params.id), req.body || {});
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true, signup: row });
});

router.delete('/api/admin/signups/:id', auth.requireAuth, (req, res) => {
  if (!db.deleteSignup(Number(req.params.id))) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Block direct access to other admin files unless signed in.
router.use('/admin', (req, res, next) => {
  if (req.path === '/login.html' || req.path === '/admin.css') return next();
  if (!auth.isAuthed(req)) return res.redirect('/admin');
  next();
});

module.exports = router;
