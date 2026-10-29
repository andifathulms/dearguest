#!/bin/sh
# Prod-like local stack: production settings, the real nginx image (SPA build,
# CSP, admin path, crawler routing), self-signed TLS, an S3 stand-in for R2
# (rclone serve s3) and Mailpit.
#   sh scripts/local-prod.sh up       # build, start, migrate, collectstatic, seed demos
#   sh scripts/local-prod.sh down     # stop (keeps data); `down -v` to wipe
#   sh scripts/local-prod.sh <any docker compose args>
# Site: https://localhost:8443 (accept the self-signed certificate).
set -eu
cd "$(dirname "$0")/.."
compose() {
  docker compose -p dglocal --env-file deploy/local-prod.env \
    -f docker-compose.prod.yml -f docker-compose.local-prod.yml "$@"
}
case "${1:-up}" in
  up)
    shift
    compose up -d --build "$@"
    compose exec -T backend python manage.py migrate --noinput
    compose exec -T backend python manage.py collectstatic --noinput -v0
    compose exec -T backend python manage.py seed_demos
    echo "Ready: https://localhost:8443  (admin: /kelola/, mail: http://localhost:8025, S3: http://localhost:9000)"
    ;;
  down) shift; compose down "$@" ;;
  *) compose "$@" ;;
esac
