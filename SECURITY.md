# Security

DearGuest holds couples' accounts and their guests' names, WhatsApp numbers, attendance, wishes and photos. This page covers the threat model, what protects what, and the risks we accept. Last reviewed: Phase 5 (October 2026).

**Report a vulnerability** to the admin email in the server's `.env` (`ADMIN_EMAIL`), not in a public issue.

## What we protect, from whom

| Asset | Threat | Protection |
|---|---|---|
| A couple's account | Stolen session through an injected script (XSS) | Sessions are **httpOnly cookies** (`dg_access` 15 min, `dg_refresh` 14 days, rotating with a blacklist), so scripts can't read them. A strict **Content-Security-Policy** (no inline or third-party scripts) makes injection hard in the first place. |
| A couple's account | A forged request from another site (CSRF) | `SameSite=Lax` cookies, and Django's CSRF token is required on every write (`CookieJWTAuthentication`). |
| A couple's account | Password guessing | Login is limited to 20 attempts an hour per address. Django's password validators apply. A password reset revokes every session. |
| Couple A's data | Couple B reading or changing it (IDOR) | Every endpoint checks ownership. `test_ownership.py` walks the whole URL configuration: a new endpoint without a classification fails CI, and every owner endpoint is tried with every method by a stranger. |
| Guests' names | Enumerating personal links | Guest codes are 6 characters from 31 symbols (≈ 887 million) and unique per invitation. Lookups are limited per address and per invitation. |
| Guests' data | Kept forever | Guest data is deleted 90 days after the invitation expires (`purge_expired`). The couple is emailed first and can export everything. Account deletion removes everything. |
| Guests' data | Leaking into third parties | Error reports, logs and CSP reports pass a PII scrubber. Exception messages, request bodies, cookies and query strings never reach Sentry (there is a test for this). nginx logs no query strings and masks guest codes. |
| Uploaded files | A file served as HTML or script | Uploads are checked by content (magic bytes), re-encoded, size-capped, and given extensions derived from their content. Media is served with `nosniff`, `CSP: sandbox` and `attachment` for anything not image or audio. |
| Admin | Takeover | It lives at a secret path (`ADMIN_URL`). Login needs **password + TOTP**. Five failures lock out for 15 minutes, and nginx limits the login URL. Every bulk action and deletion is audited. |
| The server | Known vulnerable dependencies | CI fails on high-severity advisories (`pip-audit`, `npm audit --omit=dev`). Secrets are scanned (gitleaks). `check --deploy` is clean. |
| Data | Losing the server | A nightly **age-encrypted** database dump and media mirror go to Cloudflare R2, a different provider from the server. The decryption key is offline. The restore drill is in the RUNBOOK. |

## Headers (nginx, every page)

- **CSP:** `default-src 'self'`; scripts self only; styles self + `'unsafe-inline'` + Google Fonts; images and media self + `MEDIA_DOMAIN`; frames: Google Maps, YouTube; connect: Sentry ingest; `frame-ancestors 'self'`; `object-src 'none'`.
- **Other headers:**
  - HSTS (raise `SECURE_HSTS_SECONDS` once HTTPS is proven);
  - `X-Content-Type-Options: nosniff`;
  - `X-Frame-Options: SAMEORIGIN`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `Cross-Origin-Opener-Policy: same-origin`;
  - `Permissions-Policy` turning off camera, mic, geolocation and payment.
- **Report-only switch:** `CSP_MODE=report-only` lets a blocked resource load while you investigate. Reports go to `/api/csp-report/`, which logs only the directive and the blocked origin.

## Accepted risks

1. **`style-src 'unsafe-inline'`:** React and Framer Motion set inline styles. Style injection without script injection is low impact.
2. **React Router 6 (moderate advisory):** open redirect via backslash in `<Link>`/`navigate`, and an SSR issue. We don't render on the server, and the only path built from URL input is encoded. The fix requires React Router 7.
3. **Vite 5 / esbuild (dev only):** the dev server's advisories don't ship to production. The fix requires Vite 8.
4. **The access token outlives a revocation by up to 15 minutes** after logout or a password reset. Refresh tokens are revoked at once.
5. **Distinguishing a slug:** some owner endpoints answer 403 rather than 404, so a stranger can tell a slug exists. Slugs are public URLs anyway.
6. **Single server:** the database, app and media share one VPS. Backups bound data loss to a day; the restore time is in `LAUNCH-READINESS.md`.
7. **Phase 3 (payments) isn't built.** Webhook signature checks, payment-provider CSP allowances and order/invoice ownership tests are to be added with it (`OWNERSHIP` in `test_ownership.py` has a placeholder).
