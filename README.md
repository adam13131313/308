# Sydney Marathon 3:08:59 Dashboard

A Progressive Web App (PWA) training dashboard for the Sydney Marathon,
30 August 2026. Plan view with session detail, run logging, charts,
fitness metrics, and a paste-to-Claude export.

## Files
- `index.html` - the entire app (vanilla JS, no build step, no dependencies)
- `manifest.json` - PWA manifest
- `service-worker.js` - offline caching
- `icon-192.png`, `icon-512.png` - app icons

## Hosting: GitHub Pages
This repo is set up to host directly on GitHub Pages, free, with no limits.

1. Push these files to the repo (root level).
2. On GitHub: Settings -> Pages.
3. Under "Build and deployment", Source = "Deploy from a branch".
4. Branch = `main` (or `master`), folder = `/ (root)`. Save.
5. Wait ~1 minute. Your app is live at:
   https://adam13131313.github.io/308/

Every time you push to the repo, GitHub Pages redeploys automatically -
same URL, so your phone home-screen icon keeps working.

## Install on phone
Open the GitHub Pages URL on your phone, then:
- iPhone (Safari): Share -> Add to Home Screen
- Android (Chrome): menu -> Install app

## Data
Logged runs save to your phone's localStorage and persist offline.
Baseline runs are baked into `index.html` (the SEED_RUNS object).
Use the in-app EXPORT button to copy a summary to paste into Claude.
