#!/bin/sh
# One-command rollback to the release before the current one (RUNBOOK.md):
#
#   sh scripts/rollback.sh
#
# Starts the previous release's images again (still on the server, tagged
# with its SHA; pulled again if gone, when IMAGE_PREFIX is set) and smoke-checks
# them. The database is not rolled back: deploy.sh only allows additive
# migrations, which the previous code runs on. To undo a migration too, restore
# .deploy/pre-<sha>.dump (RUNBOOK.md).
set -eu
cd "$(dirname "$0")/.."
COMPOSE="${DEPLOY_COMPOSE:-docker compose -f docker-compose.prod.yml}"
current=$(cat .deploy/current 2>/dev/null || true)
target=$(cat .deploy/previous 2>/dev/null || true)
[ -n "$target" ] || { echo "no previous release recorded in .deploy/previous" >&2; exit 1; }
echo "[rollback] ${current:-?} -> ${target}"
RELEASE="$target" $COMPOSE up -d --no-build --pull missing --remove-orphans
. ./scripts/smoke.sh
if smoke "$target"; then
  echo "$target" > .deploy/current
  echo "$current" > .deploy/previous
  echo "[rollback] OK: ${target} is live (run deploy.sh again to go forward)"
else
  echo "[rollback] smoke check failed: follow RUNBOOK.md 'Invitation down'" >&2
  exit 1
fi
