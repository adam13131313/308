# Sydney Marathon 3:08:59 Dashboard

A Progressive Web App (PWA) training dashboard for the Sydney Marathon,
30 August 2026. Plan view with session detail, run logging, charts,
fitness metrics, JSON import/export, and a paste-to-Claude summary export.

## Privacy / architecture
The app code contains NO personal data. The training PLAN (sessions, paces)
is methodology, not personal. Your logged runs and fitness metrics live only
in your phone's localStorage. Your baseline data is in `seed-data.json`,
which is gitignored and never committed.

## Files
- `index.html` - the entire app (vanilla JS, no build step, no personal data)
- `manifest.json` - PWA manifest
- `service-worker.js` - offline caching
- `icon-192.png`, `icon-512.png` - app icons
- `seed-data.json` - YOUR data (gitignored, do not commit)

## Hosting: GitHub Pages
1. Push these files (NOT seed-data.json - it is gitignored) to the repo root.
2. Repo Settings -> Pages -> Source: Deploy from a branch -> main / root.
3. Live at https://adam13131313.github.io/308/
Every push redeploys automatically, same URL.

## First-time data load
1. Open the app on your phone, tap the gear icon (top right).
2. Open seed-data.json on your computer, copy all its text.
3. In the app's Data panel, paste into the box and tap "Import pasted JSON".
Your 30 runs and metrics load into the phone's storage.

## Daily use
- PLAN tab: tap any day for the big detail view; log/edit/delete runs.
- CHART tab: cumulative km, easy-run HR trend, weekly volume.
- METRICS tab: VO2max/LT cards, add new readings (MP/LT auto-calculates).
- Gear icon: EXPORT summary for Claude, or backup/restore all data as JSON.

## Backups
Gear icon -> "Copy backup" gives you the full JSON. Save it somewhere safe
periodically so you never lose your log.
