#!/bin/bash
# Nightly backup (run_scheduler, 02:15 WIB): an age-encrypted pg_dump and a
# media sync to object storage on another provider (Cloudflare R2).
#   daily/   7 kept   weekly/ 4 kept (Sundays)   monthly/ 6 kept (the 1st)
#   media/   mirror;  media-deleted/<stamp>/ keeps removed files 30 days
# The server only holds the age *recipient* (public key); the identity that
# decrypts lives offline with the owner (RUNBOOK.md).
set -euo pipefail
cd /app
# rclone is configured by RCLONE_CONFIG_R2_* env vars; no config file.
export RCLONE_CONFIG=/tmp/rclone.conf
touch "$RCLONE_CONFIG"
step=start
report() { python manage.py ops_report backup "$1" --detail "$2" || true; }
trap 'report fail "step: $step"' ERR

: "${BACKUP_AGE_RECIPIENT:?BACKUP_AGE_RECIPIENT not set}"
remote="${BACKUP_REMOTE:-r2:dearguest-backups}"
stamp="$(date -u +%Y%m%dT%H%MZ)"
dump="/tmp/db-${stamp}.dump.age"

step=dump
PGPASSWORD="$DB_PASSWORD" pg_dump -h "${DB_HOST:-db}" -U "${DB_USER:-undangan_user}" -Fc "${DB_NAME:-undangan_db}" \
  | age -r "$BACKUP_AGE_RECIPIENT" > "$dump"
size="$(stat -c %s "$dump")"

step=upload
# Local stand-in only: R2 buckets are created by hand (RUNBOOK.md).
[ "${BACKUP_CREATE_BUCKET:-0}" = 1 ] && rclone mkdir "$remote"
rclone copyto "$dump" "$remote/daily/db-${stamp}.dump.age"
[ "$(date -u +%u)" = 7 ] && rclone copyto "$dump" "$remote/weekly/db-${stamp}.dump.age"
[ "$(date -u +%d)" = 01 ] && rclone copyto "$dump" "$remote/monthly/db-${stamp}.dump.age"
rm -f "$dump"

step=media
# Link previews (og/) are regenerated on demand; health/ is the probe file.
rclone sync /app/media "$remote/media" --backup-dir "$remote/media-deleted/${stamp}" \
  --exclude 'og/**' --exclude 'health/**' --fast-list

step=prune
rclone delete "$remote/daily" --min-age 7d
rclone delete "$remote/weekly" --min-age 28d
rclone delete "$remote/monthly" --min-age 183d
rclone delete "$remote/media-deleted" --min-age 30d --rmdirs

report ok "db ${size} bytes"
