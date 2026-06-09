# Sydney Marathon 3:08:59 Dashboard

A Progressive Web App (PWA) training dashboard for the Sydney Marathon, 30 August 2026.
Plan view, run logging, charts, fitness metrics, and a paste-to-Claude export.

## Files
- `index.html` - the entire app (vanilla JS, no build step)
- `manifest.json` - PWA manifest
- `service-worker.js` - offline caching
- `icon-192.png`, `icon-512.png` - app icons

## Deploy with Surge
```bash
npm install -g surge      # one time
cd marathon-pwa           # this folder
surge                     # follow prompts; pick a domain e.g. adam-308.surge.sh
```
To redeploy after changes, run `surge` again with the same domain.

## Install on phone
Open the surge URL on your phone, then:
- iPhone (Safari): Share -> Add to Home Screen
- Android (Chrome): menu -> Install app

## Data
Logged runs save to your phone's localStorage. The baseline runs are baked
into `index.html` (the SEED_RUNS object). Export via the in-app EXPORT button.
