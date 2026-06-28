# QA Pass — Undangan Digital

**Last updated:** 2026-06-28 · **Build:** code-split (Vite) · **Status:** automated checks pass; manual real-device cases pending execution.

## Method & scope

This document is a **repeatable QA runbook**, not a one-time report. It has two parts:

1. **Automated checks** — run from CI/local; results below are from the latest run.
2. **Manual real-device cases** — must be executed on actual phones/browsers (no automated browser/screenshot tooling is wired up yet). Fill the result columns each pass.

Legend: ✅ pass · ❌ fail · ⚠️ partial · ⬜ not yet run · 🚫 blocked

---

## 1. Automated checks (latest run: ✅ all pass)

| Check | Command | Result |
|---|---|---|
| Backend system check | `docker compose exec backend python manage.py check` | ✅ no issues |
| Frontend production build | `cd frontend && npm run build` | ✅ builds, code-split |
| Public routes serve (SPA) | curl `/ /register /dashboard /forgot-password /reset-password /my /onboarding /:slug` | ✅ 200 |
| Demo invitations live | curl `/demo-javanese … /demo-boho` | ✅ 200 |
| API endpoints | invitations / music-presets / coupons.validate / share / admin | ✅ 200 (admin 302→login) |
| Guest payload completeness | `/api/invitations/demo-rustic/` | ✅ events, stories, banks, dress_code, watermark present |
| Code splitting (guest-critical) | bundle report | ✅ InvitationPage ≈ 8 kB + shared 168 kB; editor/cropper/QR in separate chunks |

**How to re-run:** `docker compose up -d`, `python manage.py seed_demos`, then the curl sweep in `scripts` / this table.

---

## 2. Manual real-device matrix

Run the case suites below on at least:

| # | Device / OS | Browser | Notes |
|---|---|---|---|
| D1 | Android (low-end, e.g. Redmi) | Chrome | primary market; watch perf/jank |
| D2 | Android | WhatsApp in-app browser | most guests open links here |
| D3 | iPhone | Safari | autoplay/scroll quirks |
| D4 | Desktop | Chrome | editor side-by-side preview |
| D5 | Desktop | Safari/Firefox | cross-browser CSS |

---

## 3. Guest flow (the invitation) — `/:slug`

| ID | Case | Steps | Expected | D1 | D2 | D3 |
|---|---|---|---|---|---|---|
| G1 | Cover gate | Open `/demo-floral?to=Budi` | "Buka Undangan" screen; guest name "Budi" shown; page scroll locked | ⬜ | ⬜ | ⬜ |
| G2 | Open + music | Tap "Buka Undangan" | Gate fades; music starts (if set); body scrolls | ⬜ | ⬜ | ⬜ |
| G3 | Countdown | Observe countdown | Live ticking to akad date | ⬜ | ⬜ | ⬜ |
| G4 | Floating RSVP | Tap floating RSVP button | Smooth-scrolls to RSVP form | ⬜ | ⬜ | ⬜ |
| G5 | RSVP submit | Fill name, Hadir, pax, wishes → submit | Thank-you state; appears in dashboard | ⬜ | ⬜ | ⬜ |
| G6 | RSVP via guest link | Open `?to=Name&g=CODE`, submit | Name prefilled; guest shows "RSVP: Hadir" in manager | ⬜ | ⬜ | ⬜ |
| G7 | Gallery lightbox | Tap a gallery photo | Full-screen lightbox; swipe/‹ › nav; Esc/× closes | ⬜ | ⬜ | ⬜ |
| G8 | Maps | Tap "Lihat Lokasi" / embed | Opens Google Maps / shows embed | ⬜ | ⬜ | ⬜ |
| G9 | Add to calendar | Tap "Tambah ke Kalender" | Google Calendar prefilled (title/date/venue) | ⬜ | ⬜ | ⬜ |
| G10 | Digital envelope | Copy bank no. / scan QRIS / wishlist link | Copy toast; QRIS image shows; wishlist opens | ⬜ | ⬜ | ⬜ |
| G11 | Wishes wall | Submit a wish | Appears within 30s (poll) | ⬜ | ⬜ | ⬜ |
| G12 | WhatsApp share | Tap share | wa.me opens with rich preview (couple names + photo) | ⬜ | ⬜ | ⬜ |
| G13 | Inactive/expired | Open a draft slug as guest | "Undangan belum aktif/berakhir" message | ⬜ | ⬜ | ⬜ |
| G14 | All 6 themes render | Open each `demo-*` | Cover + all sections styled per theme; no overflow | ⬜ | ⬜ | ⬜ |
| G15 | Watermark by tier | free vs premium demo | Footer watermark on free, absent on premium | ⬜ | ⬜ | ⬜ |

**Visual/perf to eyeball:** font loading (no FOIT), animation smoothness on D1, no horizontal scroll, tap targets ≥ 44px.

---

## 4. Couple self-serve flow

| ID | Case | Steps | Expected | D4 | D1 |
|---|---|---|---|---|---|
| C1 | Register | `/register` → submit | Auto-login → `/onboarding` | ⬜ | ⬜ |
| C2 | Slug availability | Type taken vs free slug | Live ✓/✕ | ⬜ | ⬜ |
| C3 | Theme mini-preview | Browse theme options | Mockups (names on palette), selectable, keyboard-focusable | ⬜ | ⬜ |
| C4 | Create invitation | Pick slug/theme/date → create | Lands in editor (draft) | ⬜ | ⬜ |
| C5 | Edit + save sections | Fill couple/events/etc., Save each | Toast; persists on reload | ⬜ | ⬜ |
| C6 | Photo crop | Upload profile photo | Round crop modal; cropped image used | ⬜ | ⬜ |
| C7 | Gallery upload+compress | Upload large photo | Uploads (downscaled); reorder ‹ › works | ⬜ | ⬜ |
| C8 | Completion checklist | Leave a section empty | Checklist shows missing item; hides when complete | ⬜ | ⬜ |
| C9 | Unsaved guard | Type, then click "Undangan Saya" | Confirm prompt | ⬜ | ⬜ |
| C10 | Live preview | Toggle "Pratinjau Langsung" | Desktop: side panel; mobile: full-screen overlay; refreshes after save; no cover gate | ⬜ | ⬜ |
| C11 | Request activation | Click "Minta Aktivasi" + WhatsApp | Stepper advances; "menunggu konfirmasi" | ⬜ | ⬜ |
| C12 | Activate with code | Enter admin-issued code | Goes live; "Sudah Aktif" state | ⬜ | ⬜ |
| C13 | Multi-invitation cap | Create up to cap, try one more | Blocked at cap with "Upgrade ke Bisnis" | ⬜ | ⬜ |
| C14 | Forgot/reset password | `/forgot-password` → email link → reset | New password works | ⬜ | ⬜ |
| C15 | My Invitations hub | `/my` | Cards with status/tier; Edit/Preview/RSVP | ⬜ | ⬜ |

---

## 5. Admin / ops flow (`/admin/`)

| ID | Case | Expected | ⬜ |
|---|---|---|---|
| A1 | Activation email | Couple requests → admin receives email (console in dev) | ⬜ |
| A2 | Pending inbox | "Permintaan Aktivasi" lists only pending | ⬜ |
| A3 | Fulfill Premium | One action sets tier=premium + issues code | ⬜ |
| A4 | Fulfill Bisnis | One action sets tier=bisnis + code + cap=2 | ⬜ |
| A5 | Couple activates | Code works; invitation live; watermark removed (paid) | ⬜ |
| A6 | Music presets | Upload preset → appears in editor picker | ⬜ |
| A7 | Coupons | Create coupon → validates on landing | ⬜ |

---

## 6. Accessibility

| ID | Check | Expected | ⬜ |
|---|---|---|---|
| X1 | Keyboard nav | Tab through landing/auth/editor; visible focus ring everywhere | ⬜ |
| X2 | Form labels | All inputs have associated/aria labels (auth, onboarding, RSVP, full editor) | ⬜ |
| X3 | Cover gate | role=dialog, focus lands on "Buka Undangan" | ⬜ |
| X4 | Reduced motion | OS "reduce motion" → animations minimized | ⬜ |
| X5 | Screen reader | Announce names on icon buttons (music, RSVP, reorder, lightbox) | ⬜ |
| X6 | Contrast | Check theme `--text-muted` on tinted backgrounds (WCAG AA 4.5:1) — **known risk, audit with tooling** | ⬜ |

---

## 7. Performance

| ID | Check | Target | ⬜ |
|---|---|---|---|
| P1 | Invitation TTI on D1 (3G/4G) | < 3s to cover gate | ⬜ |
| P2 | Guest bundle | Only InvitationPage + 1 theme chunk (✅ verified in build) | ✅ |
| P3 | Gallery weight | Uploaded photos compressed (≤ ~1600px) | ⬜ |
| P4 | Lighthouse (mobile) | Perf ≥ 80, A11y ≥ 90 | ⬜ |

---

## 8. Known limitations / risks (carry-over)

- **No automated browser/E2E** yet — these cases are manual. Consider Playwright for G1–G15.
- **Contrast (X6)** not yet measured with tooling — theme muted tones on tinted backgrounds are the main suspect.
- **Unsaved guard (C9)** is best-effort: an immediate action (reorder/upload) that triggers a reload can clear the dirty flag while other text edits are unsaved.
- **Email/SMTP** prints to console in dev; production needs real SMTP env vars for A1/C14.
- **Music presets / testimonials** depend on content the admin must add.
