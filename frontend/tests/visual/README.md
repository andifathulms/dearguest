# Visual regression: theme packs

Every pack (`src/themes/packs/<id>`) has a spec in `packs/<id>.spec.js` that screenshots its
cover, hero and every section. Shared specs cover features rather than packs, on the Taman Sage
fixture:
- `market-fit.spec.js`: religion copy variants, event time zones, maps, lightbox, RSVP, profiles, gift;
- `openings.spec.js`: Lottie and layered-SVG openings;
- `editor-preview.spec.js`: the editor's live preview.

The API is stubbed (`packs/stub.js` plus `packs/fixtures/`), so no database is needed.

Baselines are Linux, Chromium and WebKit at 360, 390 and 1440 px, and run in the official Playwright
image on the dev compose network:

```bash
docker compose up -d                       # the frontend dev server must be running
make visual                                # compare against the baselines
cd frontend && sh scripts/visual-docker.sh <spec>.js --update-snapshots=changed   # after an intended change
```

Put the spec file **before** `--update-snapshots`. That flag takes an optional mode, and would
swallow a following file name as its mode.

Leave the machine idle while the suite runs. A theme folder appearing mid-run makes the dev server
reload pages, and heavy CPU load starves WebKit's in-view checks; both cause false failures.
