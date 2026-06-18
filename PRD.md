# PRD — Digital Wedding Invitation Platform
**Codename:** Undangan (placeholder, swap domain later)
**Stack:** Django 5 · Django REST Framework · React 18 · Vite · PostgreSQL · Docker · Nginx
**Phase:** 1 — Admin-Assisted (Mode B), no payment gateway

---

## 1. Product Overview

A web platform where couples in Indonesia get a beautiful, shareable digital wedding invitation at a unique URL. In Phase 1, orders come in via WhatsApp, the admin (owner) inputs everything through Django admin, and the invitation goes live immediately. Couples get a separate dashboard to monitor RSVP responses.

---

## 2. Core Personas

| Persona | Who | Goal |
|---|---|---|
| Admin | The owner (Fathul) | Create & manage all invitations via Django admin |
| Couple | The bride & groom | View their invitation, monitor RSVPs via dashboard |
| Guest | Friends & family | View invitation, submit RSVP, leave a wish |

---

## 3. Business Model — Phase 1

- **Mode B (Admin-Assisted):** No self-serve signup. Couples order via WhatsApp.
- **No payment gateway yet.** Manual transfer confirmation by admin.
- Admin activates invitation after payment confirmed.
- Each invitation expires 90 days after the wedding date.

### WhatsApp Order Flow
1. Guest DMs admin WhatsApp number (shown on landing page)
2. Admin sends order template (list of required info)
3. Couple fills and sends back via WhatsApp
4. Admin inputs into Django admin panel
5. Admin creates couple login credentials
6. Admin activates invitation → sends couple their URL + dashboard login
7. Couple shares URL to guests

---

## 4. URL Structure

```
yourdomain.com/                        → Landing page
yourdomain.com/{slug}/                 → Public invitation page
yourdomain.com/{slug}/?to=Pak+Budi     → Personalized guest view
yourdomain.com/dashboard/              → Couple login
yourdomain.com/dashboard/{slug}/       → Couple RSVP dashboard
yourdomain.com/admin/                  → Django admin (superuser only)
```

---

## 5. Themes — Phase 1

Three themes, all sharing the same section structure, different visual skin:

| ID | Name | Vibe | Palette |
|---|---|---|---|
| `javanese-dark` | Javanese Malam Emas | Traditional, luxurious | Deep tobacco `#1a1208` + gold `#c9a84c` |
| `floral-light` | Taman Bunga | Romantic, soft | Blush white `#fdf8f5` + dusty rose `#c4847a` |
| `modern-minimalist` | Minimalis Putih | Clean, contemporary | Pure white `#ffffff` + charcoal `#1f1f1f` + sage `#8a9e8a` |

Each theme is a React component that receives the same `invitation` data prop and renders accordingly. Theme selection is set by admin only.

---

## 6. Invitation Sections (All Themes)

Every invitation page renders these sections in order:

1. **Cover / Hero** — Couple names (script font), wedding date, animated entrance
2. **Opening** — Bismillah / opening text, family names, "Kepada Yth. {guest_name}" personalization
3. **Countdown Timer** — Live countdown to akad date, ticking every second
4. **Events** — Akad Nikah card + Resepsi card (date, time, venue, address, Google Maps button)
5. **Our Story** — Love story timeline (3–5 milestones, text + optional date)
6. **Bride & Groom Profiles** — Photo, name, parents, short bio per person
7. **Photo Gallery** — Full-bleed grid, up to 8 photos uploaded by admin
8. **Background Music** — Autoplay audio with floating toggle button (mute/unmute)
9. **Amplop Digital** — Bank account cards with copy-to-clipboard account number
10. **RSVP Form** — Name, WhatsApp, attending (yes/no), pax count, wishes message
11. **Wishes Wall** — Public list of submitted wishes (name + message, latest first)
12. **Google Maps Embed** — Embedded map for akad + resepsi venues
13. **Footer** — Closing text, couple names, watermark (removable on paid tier)

---

## 7. Data Models

### Invitation
```
slug                  CharField (unique, URL-safe)
theme                 CharField (choices: javanese-dark, floral-light, modern-minimalist)
is_active             BooleanField (default False)
wedding_date          DateField
expires_at            DateField (auto: wedding_date + 90 days)
opening_text          TextField
closing_text          TextField
watermark             BooleanField (default True)
music_file            FileField (nullable)
created_at            DateTimeField
couple_user           OneToOneField → User
```

### Couple
```
invitation            OneToOneField → Invitation
bride_name            CharField
bride_parents         CharField
bride_photo           ImageField (nullable)
bride_bio             TextField (nullable)
groom_name            CharField
groom_parents         CharField
groom_photo           ImageField (nullable)
groom_bio             TextField (nullable)
```

### Event
```
invitation            ForeignKey → Invitation
event_type            CharField (choices: akad, resepsi)
datetime              DateTimeField
venue_name            CharField
address               TextField
gmaps_url             URLField (nullable)
gmaps_embed_url       URLField (nullable)
```

### Story (milestone)
```
invitation            ForeignKey → Invitation
title                 CharField
description           TextField
date                  DateField (nullable)
order                 PositiveIntegerField
```

### Photo
```
invitation            ForeignKey → Invitation
image                 ImageField
caption               CharField (nullable)
order                 PositiveIntegerField
```

### BankAccount (amplop digital)
```
invitation            ForeignKey → Invitation
bank_name             CharField
account_number        CharField
account_name          CharField
order                 PositiveIntegerField
```

### RSVP
```
invitation            ForeignKey → Invitation
guest_name            CharField
whatsapp              CharField (nullable)
attending             BooleanField
pax                   PositiveIntegerField (default 1)
wishes                TextField (nullable)
submitted_at          DateTimeField (auto)
```

---

## 8. API Endpoints (DRF)

```
GET  /api/invitations/{slug}/          → Full invitation data (public)
GET  /api/invitations/{slug}/rsvps/    → RSVP list (couple auth required)
POST /api/invitations/{slug}/rsvp/     → Submit RSVP (public)
GET  /api/invitations/{slug}/wishes/   → Public wishes list
POST /api/invitations/{slug}/wish/     → Submit wish (public, same as RSVP endpoint)
POST /api/auth/login/                  → Couple login (returns JWT)
POST /api/auth/logout/                 → Logout
```

---

## 9. Frontend Pages

### Public — Invitation Page (`/{slug}/`)
- Fetches full invitation data from `/api/invitations/{slug}/`
- Reads `?to=` query param for guest name personalization
- Renders theme component based on `invitation.theme`
- All sections listed in Section 6 rendered in order
- Smooth scroll-reveal animations on section entrance
- Floating music toggle button (bottom right)
- WhatsApp share button: pre-filled message with invitation URL

### Public — Landing Page (`/`)
- Hero: "Buat undangan digital pernikahan impianmu"
- Three theme previews (screenshot/mockup cards)
- Feature highlights (countdown, RSVP, amplop, music)
- CTA: WhatsApp button → opens WA chat with admin
- Pricing tiers (static display, no payment flow yet)

### Couple — Login (`/dashboard/`)
- Simple email + password form
- JWT stored in localStorage
- Redirect to `/dashboard/{slug}/` on success

### Couple — RSVP Dashboard (`/dashboard/{slug}/`)
- Summary cards: total invited (pax sum), confirmed hadir, tidak hadir, pending
- Table: guest name, pax, attending status, wishes, submitted time
- Sortable by date submitted
- Export as CSV button
- Read-only (no editing)

---

## 10. Admin Panel (Django Admin)

Customized Django admin with:
- `InvitationAdmin` — all fields, inline for Couple, Events, Stories, Photos, BankAccounts
- `RSVPAdmin` — read-only list view with filters (by invitation, by attending status)
- Custom action: "Activate invitation" toggle
- Photo upload inline (drag order with `order` field)
- Music file upload on Invitation model

---

## 11. Auth

- **Superuser (admin/Fathul):** Django admin login
- **Couple:** Django `User` model, created by admin, linked to invitation via `couple_user`
- **JWT:** `djangorestframework-simplejwt` for couple dashboard API auth
- **Guests:** No auth. RSVP/wish submission is public (rate-limited by IP)

---

## 12. File Storage

- **Development:** Local filesystem (`/media/`)
- **Production:** Local GCP VM filesystem or GCS bucket (swap via `DEFAULT_FILE_STORAGE` env var)
- **Accepted formats:** Photos: JPG, PNG, WEBP (max 5MB each). Music: MP3 (max 10MB).

---

## 13. Docker Setup

```
services:
  db        → PostgreSQL 16
  backend   → Django (gunicorn, port 8000)
  frontend  → React/Vite (served via Nginx in prod, dev server in dev)
  nginx     → Reverse proxy (prod only)
```

Single `docker-compose.yml` for dev, `docker-compose.prod.yml` for production.

---

## 14. Environment Variables

```
SECRET_KEY
DEBUG
DATABASE_URL
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
MEDIA_ROOT
ADMIN_WHATSAPP_NUMBER    → for WA order button on landing page
```

---

## 15. Out of Scope — Phase 1

- Payment gateway (Midtrans/Xendit)
- Self-serve couple registration
- Subdomain per invitation
- Email notifications
- Custom domain for couple
- Video background
- AR / 3D effects
- Mobile app
