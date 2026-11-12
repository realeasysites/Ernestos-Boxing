const express = require('express');
const db = require('../lib/db');
const { notifyNewSignup } = require('../lib/mailer');

const router = express.Router();

const PROGRAMS = ['Adult boxing', 'Youth boxing (8+)', "Women's class", 'Conditioning', 'Open gym / day pass', 'Personal training', 'Veterans & active duty'];
const LEVELS = ['Never boxed', 'Some experience', 'Competitive / sparring'];

// Simple in-memory rate limit: 5 submissions per IP per 10 minutes.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

router.post('/api/signup', async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Too many requests. Give us a call instead.' });

  const s = {
    name: clean(b.name, 120),
    phone: clean(b.phone, 40),
    email: clean(b.email, 160),
    program: PROGRAMS.includes(b.program) ? b.program : '',
    experience: LEVELS.includes(b.experience) ? b.experience : '',
    message: clean(b.message, 2000),
  };
  if (!s.name) return res.status(400).json({ error: 'Please add your name.' });
  if (!s.phone && !s.email) return res.status(400).json({ error: 'Add a phone or email so we can reach you.' });
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) return res.status(400).json({ error: 'That email looks off.' });

  db.insertSignup(s);
  notifyNewSignup(s);
  res.json({ ok: true });
});

module.exports = router;
