# Fan Map

FanMap.com opens the functional browser application directly. The public experience has Home, Watch parties, Tailgates, Fan zone, and Saved. No pilot marketing, demo accounts, seeded social posts, or early-access form appears in the public app.

## What works

Team selection uses the shared catalog and exact stored primary/secondary palettes. One team choice per sport category can be kept on the device. Watch-party locations can be searched, opened in a map, saved, and shared. Tailgate maps independently start at the selected team's sourced stadium or arena; users can save coordinates and share a self-contained meeting-point link. Existing merchandise affiliate destinations, ticket search, publishers, and available alumni/support/donation links are retained.

Directory evidence is labeled as source checked, listed, or needing an update. None is a guarantee of an upcoming event. Unmapped addresses are not assigned invented coordinates.

## Persistence and integrations

Saved places, team choices, and meeting points use browser local storage. They do not constitute authenticated accounts or sync automatically between devices. Meeting links include coordinates and the user-entered details in the URL fragment. They are snapshots: deleting a device copy does not revoke a link already shared.

Cloud identity, public fan-board posts, shared event publishing/RSVPs, live headline ingestion, paid venue subscriptions, and payment processing require backend integrations. The public app does not pretend those services are connected. Purchases and donations occur on the external provider's site.

## Source and builds

`index.html` and `assets/web-app.js` are the public product. `app.html` and `app/index.html` redirect old entry points to the public product while preserving query parameters and shared pin links.

The archived source is `research/legacy-app.source.txt`. Research scripts and regression checks read that archive for original team/venue records. It is not executed by the public app. `scripts/build-web-assets.cjs` extracts shared base data, saved affiliate destinations, and a local Leaflet distribution into `assets/data/team-base.js` and `assets/vendor/`. It intentionally omits sample editorial stories and stale presentation counts. Location, color, and stadium research continue using the existing shared data files.

Run:

```sh
node scripts/build-web-assets.cjs
node tests/web-app.cjs
node tests/location-import.cjs
node tests/nfl-watch-scope.cjs
```

The GitHub Actions web checks also run the legacy jsdom regressions and Playwright browser checks in Chromium and WebKit. Browser tests do not send messages, buy tickets, or make donations. Screenshots and check output are retained as short-lived workflow artifacts. There is no service worker and no claim of offline map-tile availability.
