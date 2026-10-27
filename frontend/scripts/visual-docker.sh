#!/bin/sh
# Theme-pack visual suite in the official Playwright Linux image (Chromium +
# WebKit), on the dev compose network, against the `frontend` dev server.
# Needs `docker compose up -d`. Extra args go to `playwright test`, e.g.
#   npm run test:visual:docker -- --update-snapshots
# Dependencies install into a named Docker volume, never into the host's
# frontend/node_modules.
set -eu
cd "$(dirname "$0")/.."
NETWORK=${COMPOSE_NETWORK:-dearguest_default}
exec docker run --rm --network "$NETWORK" --ipc=host \
  -v "$PWD":/work -w /work \
  -v dearguest_playwright_node_modules:/work/node_modules \
  mcr.microsoft.com/playwright:v1.61.1-noble \
  sh -ec '[ -d node_modules/@playwright/test ] || npm ci --no-audit --no-fund
          exec npx --no-install playwright test -c playwright.packs.config.js "$@"' sh "$@"
