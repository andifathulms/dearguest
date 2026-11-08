# Launch readiness (Phase 5: ops and launch hardening)

**Branch:** `chore/launch-hardening`, from `main` at `ca06086`.

**Decisions** (the defaults the owner accepted):

| Topic | Choice |
|---|---|
| Hosting | One VPS, 2 vCPU / 4 GB |
| Staging | None; a prod-like local stack instead |
| Backups | Cloudflare R2 |
| CDN | Cloudflare |
| CI | GitHub Actions |
| Error tracking | Sentry |
| Uptime | UptimeRobot |
| Email | Brevo |
| Retention | Guest data 90 days after expiry; invoices 10 years |
| Alerts | Telegram, plus email for backups |

**Verdict: not ready to take money, ready for a free / manual-activation launch** once the manual steps in [§ Go-live checklist](#go-live-checklist) are done:
- Payments (Phase 3) don't exist.
- The legal pages aren't written.

Everything this phase could do in code is done and verified below.

## Commits

| Commit | What |
|---|---|
| `69f0d4a` chore(deps) | Django 5.2 LTS and patched dependencies |
| `e81db35` feat(auth) | Sessions in httpOnly cookies, CSRF, rotating refresh, logout |
| `6138b93` test(security) | Ownership sweep over every endpoint; upload re-check |
| `3787f75` feat(security) | CSP and headers, admin path, TOTP, lockout, audit |
| `e4b4fd7` feat(deploy) | Prod-like local stack |
| `2576242` feat(privacy) | Retention purge, file cleanup, export, account deletion, PII scrubber |
| `925b145` feat(ops) | Logging, health, Sentry, scheduler, encrypted backups, restore drill |
| `c331a8b` perf | Cached payload and wishes, DB connection reuse, load test |
| `b64cbe9` test(devices) | Phone emulation with throttling; copy works without the Clipboard API |
| `f6532a0` feat(deploy) | One-command deploy with automatic rollback, and rollback |
| `7c0ea00` ci | GitHub Actions, Lighthouse budgets, audits, secrets scan |
| *(last)* | Resilience test and docs: SECURITY, RUNBOOK, DEVICE-TEST, privacy notes, email deliverability, this file |

## Results with evidence

### A · Security

| Item | Result |
|---|---|
| **A1** Sessions out of localStorage | httpOnly `dg_access` (15 min) and `dg_refresh` (14 days, rotating, blacklisted after use), `SameSite=Lax`, Secure unless DEBUG. CSRF required on writes. Logout endpoint. A password reset revokes every session. 9 tests. **Browser check on the dev stack:** anonymous `/my` redirects; login sets 3 cookies with the tokens httpOnly; PATCH without CSRF → 403, with CSRF → 200; an expired access cookie refreshes silently; the editor's draft preview renders; logout clears. Existing users log in once more. |
| **A2** Ownership sweep | `test_ownership.py` walks the URL conf: **49 patterns, every one classified**. An unlisted or stale pattern fails CI. Every owner endpoint × every method tried by another couple and anonymously: 401/403/404/405, no data in the body, nothing changed (rows, couple, moderation, files). **Found and fixed:** 5 editor list endpoints answered strangers 200 with an empty list and validated uploads before refusing. Orders/invoices: Phase 3. |
| **A3** CSP and headers | Enforced CSP with no inline script, plus Referrer-Policy, Permissions-Policy, COOP, XFO, nosniff, HSTS. **Walkthrough on the prod-like stack** (landing, /tema, a theme page, all 6 demos opened and scrolled with maps and music, a guest link, login, /my, dashboard, guest list, send queue, editor with preview, onboarding): **0 violations report-only, then 0 enforced, 0 page errors**. The share page lost its inline script. The payment provider's allowances are a Phase 3 placeholder. |
| **A4** Admin | Path from `ADMIN_URL` (`/admin/` is just the app now); **TOTP required** (django-otp, `enrol_totp`); 5 failures per address+username → 15-minute lockout; nginx 5/min on the login URL (verified: `403 ×5`, then `429`); bulk actions and deletes write `LogEntry` plus `dearguest.audit` log lines. 5 tests. Refunds: Phase 3. |
| **A5** Audits | `check --deploy`: **"System check identified no issues (1 silenced)"**; the silenced W021 (HSTS preload) is deliberate until the domain is final. `pip-audit`: the old pins had advisories in Django 5.0, Pillow 10.3, DRF, simplejwt, setuptools. **Now clean** (Django 5.2.18 LTS, Pillow 13, DRF 3.18.3, …). `npm audit --omit=dev`: **0 high** (axios fixed). React Router 6 moderate and dev-only Vite advisories accepted, see SECURITY.md. gitleaks over **170 commits: no leaks** (test-fixture passwords allowlisted). |
| **A6** Uploads | Every `FileField` in the project is a checked field. 8 editor upload paths + 3 admin forms reject HTML, SVG and oversized files. |
| **A7** | `SECURITY.md` |

### B · Data protection (UU PDP)

| Item | Result |
|---|---|
| **B1** Retention | `purge_expired` (daily, 03:30 WIB): 90 days after `expires_at`, guests and open tracking, RSVPs and wishes, photos and renditions, hero, couple photos, music, bank/QRIS, gift address/phone and link previews are deleted **from the database and storage**. The notice email goes 7 days before, and deletion waits until it is a week old. `--dry-run`. Counts only in logs. Replaced or deleted uploads now leave storage too (closes MARKETFIT's "uploads never removed"). **Tests check the files are really gone.** |
| **B2** Export / delete | ZIP export (invitation.json, guests/rsvps/wishes/events CSV, every file) and account deletion, both behind a fresh password (5-minute signed cookie). Browser-verified: wrong password refused, ZIP downloaded, deletion removed the user and invitation and logged out. Anonymised invoices: Phase 3 hook. |
| **B3** PII scrubbing | One scrubber for Sentry, logs and CSP reports. **Test:** a request whose exception carries a name, WhatsApp number, email, address, guest code, `?to=` name, JWT and CSRF cookie reaches a capturing Sentry transport with **none** of them, while the type, stack and release survive. Exception messages, log parameters, non-SQL breadcrumbs, bodies, cookies and headers never leave. Timestamps and ids stay intact. |
| **B4** | `docs/privacy-notes.md`: retention numbers, data flows and processors, the open-tracking sentence. **The policy itself is yours to write.** |

### C · Backups and restore

| Item | Result |
|---|---|
| **C1** Nightly | 02:15 WIB: `pg_dump` (client 16, matching the server) piped to `age` and up to R2: daily 7, weekly 4, monthly 6. Media mirror; removed files kept 30 days. Only the public recipient is on the server. Ran on the prod-like stack: 88 KB encrypted dump + 96 media files in the S3 stand-in. |
| **C2** Restore drill | `scripts/backup/restore-drill.sh`: fresh stack, latest dump decrypted and restored, media restored; smoke checks (health, all 6 demos, a media file, admin login, SPA). **PASSED in 20 s** on the prod-like stack. That's warm images and demo-sized data, so on a new server add image builds (~3–5 min) and media download at your link speed. **Expect 15–30 minutes** including DNS, and practise it quarterly. Found and fixed during the drill: Debian's `pg_dump` 17 writes a setting the 16 server rejects, so the scheduler now uses the matching 16 client. |
| **C3** | Success = heartbeat; failure = Telegram + email. **Silence over 26 h fails the deep health check** (UptimeRobot alerts). |

### D · Observability

| Item | Result |
|---|---|
| **D1** Sentry | Backend + scheduler + frontend (lazy, 57 KB gz after idle; earlier errors queued); 5 % traces; release = git SHA; source maps uploaded during the image build and **deleted, never served**. Off until DSNs are set. |
| **D2** Logs | JSON lines with a request id from nginx to Django to the response; nginx JSON access log without query strings, guest codes masked; Docker rotation 10 MB × 5. |
| **D3** Health / uptime | `/api/health/` (DB, Redis, storage). `?deep=1` + token adds disk < 80 %, certificate > 14 days and job heartbeats. **On this dev Mac the deep check correctly reports "disk 91.5%"**. UptimeRobot monitors to create: landing, a demo invitation, `/share/<demo>/`, `/api/health/`, deep health (keyword `"status": "ok"`). The payment webhook monitor is Phase 3. |
| **D4** Alerts | 5xx spikes: a Sentry alert rule (create it: *issue count > 10 in 5 min*). Backup failure or silence, disk, certificate, stalled jobs: Telegram plus the deep health check. Stuck payment webhooks: Phase 3. |

### E · Performance and wedding-day load

**E1 · Lighthouse.** Prod-like stack, mobile profile (slow 4G 1.6 Mbps / 150 ms RTT, 4× CPU), median of 3:

| Page | LCP | CLS | TBT (lab proxy for INP) | Transfer | Score | CI budget |
|---|---|---|---|---|---|---|
| Landing `/` | 3.34 s | 0.016 | 10 ms | 917 KB | 91 | 3.9 s / 1060 KB |
| `/tema` | 3.29 s | 0.045 | 2 ms | 1,110 KB | 91 | 3.9 s / 1280 KB |
| Demo invitation (Taman Sage) | 3.83 s | 0 | 0 ms | 575 KB | 88 | 4.4 s / 680 KB |
| Personal guest link | 3.83 s | 0 | 0 ms | 575 KB | 87 | 4.4 s / 680 KB |

- The brief named the `minimal` demo, which was removed in Phase 4's catalogue cleanup; Taman Sage stands in.
- INP needs real users: Sentry's 5 % traces will report it after launch.

**E2 · Load.** k6 `loadtest/wedding-morning.js`, prod-like stack capped to the VPS (backend 1.2 CPU / 1.5 GB, db 0.5 / 1 GB, …), `SCALE=6` (the hour in 10 minutes, same 500 guests). Workload:
- 500 guests opening one invitation over the hour, 70 % via personal links: page, payload, name, open beacon, hero photo, wishes polling;
- a 50-guest spike;
- 150 RSVPs in 10 minutes;
- WhatsApp preview fetches after a blast.

Results:

| | Result |
|---|---|
| Requests | 7,821, **0 failed**, all 5,685 checks passed |
| p95 page | 16 ms |
| p95 API | 87 ms |
| p95 RSVP | 50 ms |
| p95 link preview (render on first fetch) | 148 ms |
| Max | 868 ms |

Tuning in place:
- gunicorn gthread, 2×CPU+1 workers × 4 threads;
- `CONN_MAX_AGE` 60 with health checks;
- a cached invitation payload (1 query when warm) and a 30 s wishes cache, both with exact invalidation (tests).

**Cloudflare cache rules to create:** cache everything on `/assets/*`, `/theme-previews/*`, `/social/*` (immutable), `/media/*` (7 d), `/og/*` (immutable). Bypass `/api/*`, `/kelola/*` and HTML.

**E3 · Resilience.** With Sentry unreachable and SMTP raising, invitations load and RSVPs save; password reset and activation requests degrade gracefully (`test_resilience.py`). The payment provider is Phase 3.

### F · CI/CD

| Item | Result |
|---|---|
| **F1** CI | `.github/workflows/ci.yml`: backend (Postgres/Redis, tests, `make check`, migrations, `check --deploy`), frontend (unit + build), Playwright Linux baselines, Lighthouse with budgets, pip-audit / npm audit / gitleaks. actionlint clean. **First real run when you push.** |
| **F2** Deploy | `scripts/deploy.sh` / `rollback.sh`. **Drilled on the prod-like stack:** first deploy 39 s, live; forced smoke failure → **automatic rollback** to the previous SHA, verified live; clean deploy; manual rollback → previous SHA live; a migration dropping a column → **refused (exit 2), nothing applied**. ~5–10 s of backend restart per deploy on a single host. |
| **F3** Staging | None. `scripts/local-prod.sh` runs the production compose with a local override. **It doesn't cover:** real DNS / Let's Encrypt (self-signed), Cloudflare, R2 (an rclone S3 stand-in), real email (Mailpit), the VPS's actual disk and network, real phones. |
| **F4** Email | `docs/email-deliverability.md` (SPF / DKIM / DMARC for Brevo on `mail.<domain>`). **The Gmail/Yahoo inbox check is manual and pending:** there's no domain yet. |

### G · Devices and runbook

| Item | Result |
|---|---|
| **G1** | `DEVICE-TEST.md`: the checklist for low-end Android and iPhone, each in its browser and in WhatsApp's in-app browser, 17 steps with result columns. **Waiting for your pass.** |
| **G2** Emulation | `playwright.devices.config.js`: Pixel 5 (Chromium, CPU 4×, slow 4G) and iPhone 13 (WebKit). The full guest journey and the couple's phone flows: **4/4 pass**. **Found and fixed:** copy buttons did nothing where the Clipboard API is missing or refused (non-https, some WhatsApp in-app browsers), so a guest couldn't copy the account number. There's now a fallback, used by every copy button. |
| **G3** | `RUNBOOK.md`: deploy, rollback, restore, rotate a leaked secret, wedding-day outage step by step, takedown/abuse, plus routine. Payment outage and refunds are Phase 3 placeholders. |

### Test counts

| Suite | Result |
|---|---|
| Backend | **222 passed** (`manage.py test apps`; 174 at the start of Phase 5). Final full run: 222 passed, 0 failed |
| Node unit | **19 passed** |
| Device emulation | **4 passed** |
| Visual (Linux, Chromium + WebKit, 360/390/1440) | *see [§ Visual suite](#visual-suite)* |

## Go-live checklist

Things only you can do.

**Accounts and keys** (each value goes in the server's `.env`, documented in `.env.example`):
- [ ] **VPS** (2 vCPU / 4 GB, Singapore/Jakarta): Docker; `unattended-upgrades`; SSH keys only; firewall 22/80/443.
- [ ] **Prebuilt images:** the GitHub variables for the `images` job, `docker login ghcr.io` on the VPS, and `IMAGE_PREFIX` in `.env` (RUNBOOK.md §1).
- [ ] **Domain** in Cloudflare.
  - DNS A record to the VPS (proxied).
  - SSL mode **Full (strict)**.
  - The cache rules in E2.
  - Set `DOMAIN`, `FRONTEND_URL`, `VITE_PUBLIC_ORIGIN`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`.
- [ ] **Secrets:**
  - `SECRET_KEY` (≥ 50 characters), `DB_PASSWORD`, `HEALTH_TOKEN`;
  - `ADMIN_URL` / `ADMIN_PATH` (not "admin").
- [ ] **R2:**
  - bucket `dearguest-backups`;
  - a token scoped to it (`RCLONE_CONFIG_R2_*`).
- [ ] **Backup key:**
  - `age-keygen` on your own machine;
  - put the **public** key in `BACKUP_AGE_RECIPIENT`;
  - keep the identity offline (password manager + paper);
  - run the restore drill against R2 once.
- [ ] **Sentry:**
  - backend and frontend projects; DSNs;
  - an auth token file for source maps;
  - the 5xx alert rule;
  - choose the data region.
- [ ] **UptimeRobot:** the 5 monitors in D3; alert contacts Telegram + email.
- [ ] **Telegram bot** (BotFather) and chat id.
- [ ] **Brevo:**
  - SMTP credentials;
  - the DNS records in `docs/email-deliverability.md`;
  - the **Gmail + Yahoo inbox test**.

**First deploy:**
- [ ] `sh scripts/deploy.sh`, then issue certificates (PHASE0-REPORT "First real production deploy").
- [ ] `createsuperuser`, then **`enrol_totp <user>`**. You can't log in to the admin without it.
- [ ] `seed_demos`.
- [ ] Raise `SECURE_HSTS_SECONDS` in steps once HTTPS is proven.

**Before taking couples:**
- [ ] **The `DEVICE-TEST.md` pass** on real phones.
- [ ] **Legal pages:**
  - privacy policy (input: `docs/privacy-notes.md`);
  - terms of service;
  - a takedown contact;
  - licences for demo photos and music (RECON 2.7).
- [ ] Brand spelling "DearGuest" vs "Dear Guest" (Phase 4 follow-up).
- [ ] Reserved slugs (`tema`, `dashboard`, `kelola`, …) rejected at signup (Phase 4 follow-up; not done here).
- [ ] Run the full visual suite twice on an idle machine.

**Before taking money:**
- [ ] Phase 3 (payments). Then fill in: order/invoice ownership tests, webhook alerts and uptime check, CSP allowances, anonymised invoices on account deletion, checkout on the device test, the payment-outage and refund runbooks.

## Go / no-go: RECON §2 launch blockers

| # | Blocker (RECON §2) | Status | Where |
|---|---|---|---|
| 2.1 | Prod deploy broken (nginx, SPA, TLS vs HSTS) | ✅ fixed | Phase 0; now with deploy/rollback scripts and drills (F2) |
| 2.2 | Relative WhatsApp share links in prod | ✅ fixed | Phase 0 (`VITE_PUBLIC_ORIGIN` required) |
| 2.3 | Unvalidated uploads, served next to localStorage tokens | ✅ fixed | Phase 0 validation; re-checked on every field (A6); tokens moved to httpOnly cookies (A1); CSP (A3) |
| 2.4 | DELETE on music preset deleted the invitation | ✅ fixed | Phase 0; the ownership sweep covers every method on it (A2) |
| 2.5 | No payment gateway | ⛔ **no-go for paid launch** | Phase 3 not built (decisions pending) |
| 2.6 | Pricing page promises missing features (UU 8/1999) | ⚠️ open | Phase 3 rebuilds pricing from product data. Phase 4 fixed the theme claim, but the pricing copy is untouched |
| 2.7 | Licensing undocumented; no terms or takedown | ⚠️ partly | Takedown process in RUNBOOK §7; terms and licences are yours to write |
| 2.8 | No privacy policy; nothing deleted after the wedding | ⚠️ partly | Deletion, notice, export and account deletion built (B1–B3); **policy text pending** (input in docs/privacy-notes.md) |
| 2.9 | Invitations could expire before their wedding | ✅ fixed | Phase 0 |
| 2.10 | Copy assumed Muslim couples and WIB | ✅ fixed | Phase 2 (copy variants, event time zones) |
| 2.11 | Visual quality not sellable | ✅ fixed | Phases 1 and 4 (painted packs); real-device pass pending (G1) |

## Visual suite

Full suite: Linux, Chromium + WebKit at 360/390/1440, 276 tests, run twice. The cookie-session change touched every dashboard page, and the suite shows no regression from it.

| Run | Load average | Passed | Failed |
|---|---|---|---|
| 1 | ≈ 4 | **264** | **0** (12 skipped by design) |
| 2 | 12–14 (another session building a theme pack) | 258 | 6, all WebKit: maps × 2, lightbox, two opening presets, editor preview |
| Re-run of those 6 | ≈ 12 | 5 of 6 pass alone | 1: `maps load only when asked` (webkit-1440) |

The one holdout fails alone as well while the load stays at about 9, timing out in the shared in-view reveal wait (`waitRevealed`). That's the same WebKit reveal flakiness noted since THEMEPACK-REPORT §7; it timed out under load in the Phase 2 and Phase 4 runs too and passed in run 1 here.

**Not the clean double pass the project rules ask for.** Run the suite twice on an idle machine before release (go-live checklist).

## Accepted risks

From `SECURITY.md`:
1. `style-src 'unsafe-inline'`.
2. React Router 6 (moderate) and dev-only Vite advisories.
3. Access tokens outlive a revocation by up to 15 minutes.
4. Some owner endpoints answer 403 rather than 404.
5. A single server: data loss bounded by the nightly backup (≤ 24 h), plus a few seconds of downtime per deploy.

Also:
6. **Local drills ≠ production:** the restore time, load numbers and Lighthouse scores come from the prod-like stack on a busy dev Mac with an S3 stand-in. Repeat the restore drill against R2 and spot-check Lighthouse on the real domain after go-live.
7. **CI hasn't run yet:** the workflow is linted but untested on GitHub until the first push.
8. **The Sentry frontend chunk** (57 KB gz) loads on every invitation after idle; it can be limited to errors only if mobile data cost matters more than traces.
9. **Merging:** the user's local `docker-compose.yml` (port remap, uncommitted) will conflict with this branch's dev compose changes (the `/api` proxy, the `app` build target). Keep both when merging.
