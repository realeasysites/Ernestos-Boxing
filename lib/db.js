const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dir = process.env.DB_DIR || path.join(__dirname, '..', 'db');
fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, 'ernestos.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    program TEXT,
    experience TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const STATUSES = ['new', 'contacted', 'booked', 'joined', 'closed'];

module.exports = {
  STATUSES,
  insertSignup(s) {
    return db.prepare(`INSERT INTO signups (name, phone, email, program, experience, message)
      VALUES (@name, @phone, @email, @program, @experience, @message)`).run(s);
  },
  listSignups() {
    return db.prepare('SELECT * FROM signups ORDER BY datetime(created_at) DESC').all();
  },
  updateSignup(id, { status, notes }) {
    const row = db.prepare('SELECT * FROM signups WHERE id = ?').get(id);
    if (!row) return null;
    const next = {
      status: STATUSES.includes(status) ? status : row.status,
      notes: typeof notes === 'string' ? notes.slice(0, 2000) : row.notes,
    };
    db.prepare('UPDATE signups SET status = ?, notes = ? WHERE id = ?').run(next.status, next.notes, id);
    return { ...row, ...next };
  },
  deleteSignup(id) {
    return db.prepare('DELETE FROM signups WHERE id = ?').run(id).changes > 0;
  },
};
