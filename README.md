# Ernesto's Boxing Gym: Website

Website and free-class lead dashboard for Ernesto's Boxing Gym, 17 Wordsworth St, Portland, ME. Built by [Real Easy Sites](https://getrealeasysites.com).

## Stack
- Node 20 + Express, SQLite (better-sqlite3)
- `server.js` is the entry point. Logic lives in `lib/` (db, auth, mailer) and `routes/` (public form API, admin dashboard)
- Static site in `public/`

## Run locally
```bash
npm install
ADMIN_PASSWORD=choose-one npm start
# http://localhost:3000 and http://localhost:3000/admin
```

## Environment
| Var | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Dashboard password (password only, no username). Login stays disabled until this is set. |
| `SESSION_SECRET` | Signs the admin session cookie |
| `DB_DIR` | Folder for the SQLite file (use a persistent disk on Render, e.g. `/var/data`) |
| `NOTIFY_EMAIL` | Inbox that gets new sign-up alerts |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outgoing mail for alerts (optional) |

## Dashboard
`/admin` lists every free-class sign-up. Each one has a status (new, contacted, booked, joined or closed), private notes, and a Delete button for spam and test entries.
