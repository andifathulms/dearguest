#!/bin/sh
# Restore drill: rebuild a FRESH stack from the latest backup and prove it
# works. A backup isn't real until it has been restored (RUNBOOK.md).
#
#   sh scripts/backup/restore-drill.sh <age-identity-file> [env-file] [--keep]
#
# env-file holds the backup settings (BACKUP_REMOTE, RCLONE_CONFIG_R2_*);
# default deploy/local-prod.env, whose S3 stand-in is reached on the host's
# port 9000. The drill stack (project "dgrestore", https://localhost:8444) is
# deleted afterwards unless --keep. Prints the time from start to verified.
set -eu
cd "$(dirname "$0")/../.."
identity="${1:?usage: restore-drill.sh <age-identity-file> [env-file] [--keep]}"
envfile="${2:-deploy/local-prod.env}"
keep="${3:-}"
[ -s "$identity" ] || { echo "no identity file at $identity" >&2; exit 1; }
start=$(date +%s)

export HTTP_PORT=8081 HTTPS_PORT=8444 ENV_FILE="$envfile"
compose() {
  docker compose -p dgrestore --env-file "$envfile" -f docker-compose.prod.yml -f docker-compose.local-prod.yml "$@"
}
# Inside the drill containers the local S3 stand-in is on the host.
s3_endpoint=$(grep '^RCLONE_CONFIG_R2_ENDPOINT=' "$envfile" | cut -d= -f2-)
case "$s3_endpoint" in *//s3:*) s3_endpoint="http://host.docker.internal:9000" ;; esac

cleanup() { [ "$keep" = "--keep" ] || compose down -v >/dev/null 2>&1; }
trap cleanup EXIT

echo "== 1. fresh database and cache"
compose down -v >/dev/null 2>&1 || true   # never restore over an old drill
compose up -d --wait db redis >/dev/null 2>&1
compose build scheduler backend nginx >/dev/null 2>&1

echo "== 2. fetch, decrypt and restore the latest dump; restore media"
compose run --rm --no-deps -T -v "$(cd "$(dirname "$identity")" && pwd)/$(basename "$identity"):/run/identity:ro" \
  -e RCLONE_CONFIG_R2_ENDPOINT="$s3_endpoint" -e RCLONE_CONFIG=/tmp/rclone.conf scheduler bash -euo pipefail -c '
    touch /tmp/rclone.conf
    latest=$(rclone lsf "$BACKUP_REMOTE/daily" | sort | tail -1)
    echo "   dump: $latest"
    rclone copyto "$BACKUP_REMOTE/daily/$latest" /tmp/latest.dump.age
    age -d -i /run/identity /tmp/latest.dump.age > /tmp/latest.dump
    PGPASSWORD="$DB_PASSWORD" pg_restore -h db -U "${DB_USER:-undangan_user}" -d "${DB_NAME:-undangan_db}" --no-owner /tmp/latest.dump
    rclone copy "$BACKUP_REMOTE/media" /app/media --fast-list
    echo "   media files: $(find /app/media -type f | wc -l)"
  '

echo "== 3. start the app on the restored data"
compose up -d backend nginx >/dev/null 2>&1
compose exec -T backend python manage.py migrate --noinput >/dev/null
compose exec -T backend python manage.py collectstatic --noinput -v0

echo "== 4. smoke checks"
base=https://localhost:8444
fail=0
check() { if "$@"; then echo "   ok   $label"; else echo "   FAIL $label"; fail=1; fi; }
for i in $(seq 1 30); do curl -sk -o /dev/null "$base/api/health/" && break; sleep 2; done
label="health"; check sh -c "curl -sk $base/api/health/ | grep -q '\"status\": \"ok\"'"
for slug in $(compose exec -T backend python manage.py shell -c "from apps.invitations.models import Invitation as I; print(' '.join(I.objects.filter(slug__startswith='demo-').values_list('slug', flat=True)))" 2>/dev/null | tail -1); do
  label="invitation $slug"; check sh -c "curl -sk -o /dev/null -w '%{http_code}' $base/api/invitations/$slug/ | grep -q 200"
done
media=$(curl -sk "$base/api/invitations/demo-taman-sage/" | python3 -c "import json,sys; print(json.load(sys.stdin)['hero_photo'])")
label="media file"; check sh -c "curl -sk -o /dev/null -w '%{http_code}' '$media' | grep -q 200"
admin_path=$(grep '^ADMIN_PATH=' "$envfile" | cut -d= -f2)
label="admin login page"; check sh -c "curl -sk -o /dev/null -w '%{http_code}' $base/${admin_path:-admin}/login/ | grep -q 200"
label="SPA"; check sh -c "curl -sk $base/demo-taman-sage | grep -q '<div id=\"root\">'"

elapsed=$(( $(date +%s) - start ))
echo "== restore drill: $([ $fail = 0 ] && echo PASSED || echo FAILED) in ${elapsed}s ($((elapsed / 60))m $((elapsed % 60))s)"
exit $fail
