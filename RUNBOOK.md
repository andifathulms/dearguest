# Runbook

Commands run on the server, in the repo directory (e.g. `/srv/dearguest`), as the deploy user, unless a step says otherwise.

```sh
dc() { docker compose -f docker-compose.prod.yml "$@"; }
```

Where things are:

| What | Where |
|---|---|
| Logs | `dc logs -f --tail=200 backend` (and `nginx`, `scheduler`). JSON, one line per event, with a `request_id` you can follow from nginx to Django. |
| Errors | Sentry |
| Uptime | UptimeRobot |
| Alerts | Telegram |
| Health | `https://<domain>/api/health/`; with the token: `?deep=1` |

---

## 1. Deploy

```sh
sh scripts/deploy.sh                # origin/main
sh scripts/deploy.sh v2026.11.02    # a tag or SHA
```

What it does:
1. Builds images tagged with the SHA.
2. **Refuses destructive migrations** (dropping or renaming columns or tables, raw SQL), because the previous release must still run on the new schema.
3. Dumps the database to `.deploy/pre-<sha>.dump`.
4. Migrates and switches over.
5. Smoke-checks: health reports the new SHA; landing, demo invitation, its API and its share page answer.
6. **Rolls back automatically** if the smoke checks fail.

A destructive change ships in two deploys:
1. Deploy code that no longer uses the column.
2. Deploy the migration that drops it, with `sh scripts/deploy.sh --allow-destructive <ref>`.

Expect a few seconds of 502s while the backend container restarts (single host).

## 2. Roll back

```sh
sh scripts/rollback.sh
```

- Starts the previous release's images (still on the server) and smoke-checks them.
- The database stays on the new schema, which the old code supports, because deploys only allow additive migrations.
- To undo a migration as well, restore the pre-deploy dump:

```sh
dc stop backend scheduler
dc exec -T db sh -c 'dropdb -U "$POSTGRES_USER" "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
dc exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' < .deploy/pre-<sha>.dump
sh scripts/rollback.sh
```

## 3. Restore from backup (server lost, or data corrupted)

**Before you need it:**
- The **age identity** (private key) that decrypts backups is kept offline: a password manager entry plus a printed copy.
- The server only holds the public recipient (`BACKUP_AGE_RECIPIENT`).
- Test it every quarter with the drill: `sh scripts/backup/restore-drill.sh <identity-file> <env-file>`.

**On a new server:**
1. Install Docker, clone the repo, copy `.env` from your password manager, and point DNS at the new IP (Cloudflare).
2. Bring up the database:

   ```sh
   dc up -d --wait db redis
   ```

3. Put the identity on the server for this step only (`/root/backup.key`, mode 600), then restore:

   ```sh
   dc build scheduler
   dc run --rm --no-deps -v /root/backup.key:/run/identity:ro scheduler bash -euo pipefail -c '
     export RCLONE_CONFIG=/tmp/r.conf; touch $RCLONE_CONFIG
     latest=$(rclone lsf "$BACKUP_REMOTE/daily" | sort | tail -1); echo "$latest"
     rclone copyto "$BACKUP_REMOTE/daily/$latest" /tmp/db.age
     age -d -i /run/identity /tmp/db.age > /tmp/db.dump
     PGPASSWORD="$DB_PASSWORD" pg_restore -h db -U "$DB_USER" -d "$DB_NAME" --no-owner /tmp/db.dump
     rclone copy "$BACKUP_REMOTE/media" /app/media --fast-list'
   shred -u /root/backup.key
   ```

4. Deploy and check:

   ```sh
   sh scripts/deploy.sh
   ```

   Then issue certificates (PHASE0-REPORT "First real production deploy"), and enrol TOTP again if needed.

Data loss is at most what happened since 02:15 WIB (the last backup). An older backup: `weekly/` or `monthly/`.

## 4. A secret leaked

| Secret | Rotate |
|---|---|
| `SECRET_KEY` | New value in `.env`, then `sh scripts/deploy.sh <current sha>`. **Every couple is logged out** (tokens are signed with it), and password-reset links die. |
| `DB_PASSWORD` | `dc exec db psql -U $DB_USER -c "ALTER USER … PASSWORD '…'"`, update `.env`, redeploy. |
| R2 keys | Revoke in Cloudflare, create new ones, update `RCLONE_CONFIG_R2_*`, `dc up -d scheduler`, then run a backup now: `dc exec scheduler python manage.py run_scheduler --once backup`. |
| age identity (backup key) | Generate a new pair (`age-keygen`) and set the new `BACKUP_AGE_RECIPIENT`. Old backups stay readable with the old key **until they age out (6 months)**; delete them early in R2 if the old key leaked. |
| Brevo SMTP key, Sentry token, Telegram bot | Revoke in each service, update `.env`, `dc up -d`. |
| `HEALTH_TOKEN` | Change it in `.env` and in the UptimeRobot monitor URL. |
| Staff account | `dc exec backend python manage.py changepassword <user>` and `enrol_totp <user> --reset`. Check the admin history (Recent actions, audit log lines). |

Afterwards, look at the logs and Sentry around the leak window, and write down what was exposed.

## 5. Payment provider outage (Phase 3)

*Placeholder until payments exist.* Fill in:
- how to tell (webhook alert, provider status page);
- what couples see;
- the message to send them;
- how to reconcile orders afterwards: compare the provider's settlement report with `pending` orders older than their expiry.

## 6. "The invitation is down" an hour before the akad

Work top to bottom and stop when it's fixed. Tell the couple on WhatsApp within 5 minutes that you are on it.

1. **Is it the whole site or one invitation?**
   - Open `https://<domain>/api/health/` and the landing page from your phone on mobile data.
   - Whole site down: go to 2. One invitation: go to 6.
2. **Is the server up?** SSH in. If you can't, check the VPS provider's console and status page, and reboot from there.
3. **Containers:** `dc ps`. Anything not `Up`: `dc up -d`, then `dc logs --tail=100 <service>`.
4. **Just deployed?** `sh scripts/rollback.sh`. This is fast and safe.
5. **Disk full?** `df -h`.
   - Free space: `docker system prune -f` (images and build cache only, **not** volumes).
   - Then: `dc logs` sizes are capped, but check `/var/lib/docker`.
6. **One invitation:**
   - `curl -s https://<domain>/api/invitations/<slug>/`. A 403 means not active or expired: check `is_active` and `expires_at` in the admin. Expiry is 90 days after the wedding, so before the wedding it is usually `is_active`.
   - A 500: check Sentry (search by the request id from `dc logs nginx`).
7. **Database:** `dc exec db pg_isready`. If it is down: `dc restart db`, then `dc logs db`.
8. **Slow rather than down?**
   - `dc stats` for CPU and memory.
   - Raise workers temporarily: set `GUNICORN_WORKERS=7` in `.env`, then `dc up -d backend`.
   - Cloudflare → Caching → check the cache rules are on.
9. **Still down after 20 minutes:**
   - send the couple a screenshot or PDF of the invitation, the event details, and a Google Maps link to forward in their WhatsApp groups;
   - keep working on 1–8;
   - write it up afterwards.

## 7. Takedown or abuse report

1. Record the URL, who reported it and when.
2. Look at it. If it's clearly abusive (impersonation, illegal content, spam), deactivate it now:
   - admin → Invitations → select → *Nonaktifkan undangan yang dipilih*. This is audited.
   - The public page then says "belum aktif".
3. Tell the account owner by email and WhatsApp why, and how to respond.
4. Copyright (a photo or song): deactivate, ask the couple to replace the item, and reactivate when they have.
5. Keep the record (date, URL, decision) for 1 year. Delete content only through the normal account deletion or retention.

## 8. Manual refund (Phase 3)

*Placeholder until payments exist:* the provider's dashboard refund flow, marking the order refunded in the admin (audited), the email to the couple, and tier downgrade rules.

---

## Routine

| When | What |
|---|---|
| Daily (automatic) | 02:15 backup; 03:30 retention purge; certificate check every 6 h. A missed job or a failure reaches Telegram, and the deep health check goes red. |
| Weekly | Glance at Sentry, the UptimeRobot report, and `df -h`. |
| Monthly | `docker system prune -f`; apply OS updates (`unattended-upgrades` on); check the backup bucket sizes. |
| Quarterly | **Restore drill** (`scripts/backup/restore-drill.sh`), and write the time in LAUNCH-READINESS.md. Rotate `HEALTH_TOKEN`. |
| Before a big wedding weekend | Check the deep health check; make sure no deploy is planned within 24 h of an akad you know of. |
