#!/bin/sh
# One-command deploy, run on the server from the repo directory (RUNBOOK.md):
#
#   sh scripts/deploy.sh                 # deploy origin/main
#   sh scripts/deploy.sh <git-ref>       # a tag, branch or SHA
#   sh scripts/deploy.sh --allow-destructive <ref>
#
# 1. check out the commit; build images tagged with its SHA, or pull the ones
#    CI pushed when IMAGE_PREFIX is set in .env (e.g. ghcr.io/<owner>/dearguest)
# 2. refuse destructive migrations (dropping or renaming tables/columns, raw
#    SQL) unless --allow-destructive: the previous release must keep working
#    on the new schema, or rolling back is impossible
# 3. dump the database (kept in .deploy/, last 3)
# 4. migrate, collect static files, switch every service to the new images
# 5. smoke checks; on failure roll back to the previous images automatically
# 6. remove the images of releases older than the previous one
#
# Settings for other setups (the prod-like local stack, drills):
#   DEPLOY_COMPOSE  the compose command   (default: docker compose -f docker-compose.prod.yml)
#   SMOKE_BASE      the site's URL        (default: https://$DOMAIN from .env)
#   DEPLOY_SKIP_GIT=1  deploy the working tree's HEAD without fetching/checking out
#   DEPLOY_FORCE_SMOKE_FAIL=1  make the smoke check fail (rollback drill)
set -eu
cd "$(dirname "$0")/.."

allow_destructive=0
if [ "${1:-}" = "--allow-destructive" ]; then allow_destructive=1; shift; fi
ref="${1:-origin/main}"
COMPOSE="${DEPLOY_COMPOSE:-docker compose -f docker-compose.prod.yml}"
compose() { $COMPOSE "$@"; }
mkdir -p .deploy
log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

# --- 1. the commit and its images ------------------------------------------
if [ "${DEPLOY_SKIP_GIT:-0}" = 1 ]; then
  sha=$(git rev-parse HEAD)
else
  git fetch --quiet origin
  sha=$(git rev-parse --verify "${ref}^{commit}")
  git checkout --quiet --detach "$sha"
fi
prev=$(cat .deploy/current 2>/dev/null || true)
log "deploying ${sha} (previous: ${prev:-none})"
export RELEASE="$sha"
prefix="${IMAGE_PREFIX:-$(sed -n 's/^IMAGE_PREFIX=//p' "${ENV_FILE:-.env}" 2>/dev/null | tail -n 1)}"
if [ -n "$prefix" ]; then
  log "pulling ${prefix}-{backend,scheduler,nginx}:${sha}"
  if ! compose pull --quiet backend scheduler nginx; then
    log "no images for ${sha} on the registry yet: CI pushes them once its checks pass on main."
    log "wait for the 'images' job (or check docker login ghcr.io), then deploy again."
    exit 3
  fi
else
  compose build --quiet backend scheduler nginx
fi

# --- 2. migrations -----------------------------------------------------------
plan=$(compose run --rm --no-deps -T backend python manage.py migrate --plan 2>&1 || true)
echo "$plan" | sed 's/^/  /'
risky=$(echo "$plan" | grep -E '^\s+(Remove field|Delete model|Rename field|Rename model|Raw SQL operation|Alter unique_together|Remove constraint|Remove index)' || true)
if [ -n "$risky" ] && [ "$allow_destructive" != 1 ]; then
  log "REFUSED: destructive migration(s) would break rollback:"
  echo "$risky" | sed 's/^/    /'
  log "deploy them in two steps (stop using the column, deploy; then drop it), or pass --allow-destructive."
  exit 2
fi

# --- 3. a dump before touching the schema --------------------------------------
dump=".deploy/pre-${sha}.dump"
compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$dump"
log "database dumped to $dump ($(wc -c < "$dump") bytes)"
ls -1t .deploy/pre-*.dump 2>/dev/null | tail -n +4 | xargs rm -f

# --- 4. migrate and switch -----------------------------------------------------
compose run --rm --no-deps -T backend python manage.py migrate --noinput
compose run --rm --no-deps -T backend python manage.py collectstatic --noinput -v0
compose up -d --no-build --remove-orphans

# --- 5. smoke checks, rollback on failure -------------------------------------
. ./scripts/smoke.sh
if smoke "$sha"; then
  [ -n "$prev" ] && [ "$prev" != "$sha" ] && echo "$prev" > .deploy/previous
  echo "$sha" > .deploy/current
  log "OK: ${sha} is live"
  # --- 6. keep only this release's and the previous one's images ---------------
  keep=" $sha ${prev:-} "
  p="${prefix:-dearguest}"
  docker image ls --format '{{.Repository}}:{{.Tag}}' | while read -r img; do
    case "$img" in "$p"-backend:*|"$p"-scheduler:*|"$p"-nginx:*) ;; *) continue ;; esac
    case "$keep" in *" ${img##*:} "*) ;; *) docker image rm "$img" >/dev/null 2>&1 && log "removed old image $img" ;; esac
  done || true   # an image still in use stays; never fail a release that is live
  exit 0
fi
log "SMOKE CHECK FAILED for ${sha}"
if [ -z "$prev" ]; then
  log "no previous release to roll back to; the stack is left as it is"
  exit 1
fi
log "rolling back to ${prev}"
RELEASE="$prev" compose up -d --no-build --pull missing --remove-orphans
if DEPLOY_FORCE_SMOKE_FAIL=0 smoke "$prev"; then
  log "rolled back: ${prev} is live again (database keeps the new, additive schema)"
else
  log "ROLLBACK ALSO FAILED: follow RUNBOOK.md 'Invitation down'"
fi
exit 1
