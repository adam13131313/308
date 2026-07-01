# Sydney Marathon 3:08:59 Dashboard

A Progressive Web App (PWA) training dashboard for the Sydney Marathon,
30 August 2026. Plan view with session detail, run logging, charts,
fitness metrics, JSON import/export, and a paste-to-Claude summary export.

## Privacy / architecture
The app code contains NO personal data. The training PLAN (sessions, paces)
is methodology, not personal. Your logged runs and fitness metrics are
stored locally in your browser's localStorage, and optionally synced to a
private Supabase project scoped to your account only (row-level security
keyed to your user id — nobody else can read or write your rows). Signing
in is optional: the app is fully usable offline / local-only without ever
signing in, and if Supabase is unreachable the app keeps working entirely
from its local cache and syncs again once back online. Your baseline data
is in `seed-data.json`, which is gitignored and never committed.

## Files
- `index.html` - the entire app (vanilla JS, no build step). Loads the
  `@supabase/supabase-js` client from a CDN and contains a hardcoded
  Supabase project URL + anon key - that key is safe to be public, access
  is enforced by row-level security, not by keeping the key secret.
- `supabase/schema.sql` - one-time database setup (tables, RLS policies,
  realtime publication). Paste into the Supabase SQL editor once per project.
- `manifest.json` - PWA manifest
- `service-worker.js` - offline caching
- `icon-192.png`, `icon-512.png` - app icons
- `seed-data.json` - YOUR data (gitignored, do not commit)

## Sync (phone + web)
GitHub Pages already serves `index.html` as both the "web version" (visit
the URL in any browser) and the "phone app" (Add to Home Screen installs
the same page as a PWA) - they're the same code. To keep both in sync:
1. Create a free project at supabase.com, run `supabase/schema.sql` in its
   SQL editor, then fill in `SUPABASE_URL` / `SUPABASE_ANON_KEY` near the
   top of `index.html`'s script.
2. Open the app, tap DATA, enter your email under ACCOUNT, then enter the
   6-digit code emailed to you. This is a one-time step per device/install.
3. Once signed in on two devices, edits sync automatically (with realtime
   push, no manual refresh needed) using last-write-wins per record.
This is a single personal account, not a shared/multi-user service.

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
