#!/bin/sh
# Theme preview stills and loops (capture-previews.mjs), recorded from the demo
# invitations on the dev stack. Needs `docker compose up -d`; args are theme ids.
#   sh scripts/capture-docker.sh          # every active theme
#   sh scripts/capture-docker.sh sunda
set -eu
cd "$(dirname "$0")/.."
NETWORK=${COMPOSE_NETWORK:-dearguest_default}
IMAGE=dearguest-capture:1.61.1
docker image inspect "$IMAGE" >/dev/null 2>&1 || docker build -t "$IMAGE" -f scripts/capture.Dockerfile scripts
exec docker run --rm --network "$NETWORK" --ipc=host \
  -v "$PWD/..":/repo -w /repo/frontend \
  -v dearguest_playwright_node_modules:/repo/frontend/node_modules \
  "$IMAGE" \
  sh -ec '[ -d node_modules/@playwright/test ] || npm ci --no-audit --no-fund
          exec node scripts/capture-previews.mjs "$@"' sh "$@"
