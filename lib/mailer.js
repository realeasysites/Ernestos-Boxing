// Optional email alerts for new sign-ups. Silently skipped until SMTP env vars are set.
const nodemailer = require('nodemailer');

let transport = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function notifyNewSignup(s) {
  if (!transport || !process.env.NOTIFY_EMAIL) return;
  const lines = [
    `Name: ${s.name}`,
    `Phone: ${s.phone || '-'}`,
    `Email: ${s.email || '-'}`,
    `Program: ${s.program || '-'}`,
    `Experience: ${s.experience || '-'}`,
    '',
    s.message || '',
  ];
  try {
    await transport.sendMail({
      from: `"Ernesto's Website" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      replyTo: s.email || undefined,
      subject: `New free-class sign-up: ${s.name} (${s.program || 'general'})`,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('Email alert failed:', err.message);
  }
}

module.exports = { notifyNewSignup };
