#!/bin/sh
# Wedding-morning load test against the prod-like local stack
# (scripts/local-prod.sh up). Seeds 500 guests, runs k6 in Docker on the
# stack's network, prints the summary. SCALE=6 (default) compresses the hour
# into 10 minutes; SCALE=1 runs it in real time.
set -eu
cd "$(dirname "$0")/.."
compose() { sh scripts/local-prod.sh "$@"; }
compose exec -T backend python manage.py shell < loadtest/seed.py
compose cp backend:/tmp/codes.json loadtest/codes.json >/dev/null
docker run --rm --network dglocal_default -v "$PWD/loadtest:/data:ro" -e SCALE="${SCALE:-6}" \
  -e K6_NO_USAGE_REPORT=true grafana/k6:0.58.0 run --quiet /data/wedding-morning.js
