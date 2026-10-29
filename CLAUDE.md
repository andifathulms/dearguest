# CLAUDE.md — DearGuest (Undangan Digital Platform)

## Read first: how this repo works now (October 2026)

The original build spec further down is **historical**. The app has since moved on: theme packs replace
the three CSS themes, events have time zones, there are religion copy variants, and so on. Where they
disagree, this section, the reports (`THEMEPACK-REPORT.md`, `MARKETFIT-REPORT.md`) and the code win.

### Themes = painted packs only
- Every theme is a pack in `frontend/src/themes/packs/<id>/`, listed in `shared/themes.json`. Run
  `make themes` after editing it.
- Each pack has real painted art. Image-less CSS themes were removed (migration `0040`).
- Catalogue direction, naming rule, categories and the next themes to build: **`CATALOG-DIRECTION.md`**.
- System docs: `docs/theme-packs.md` (slots, layouts, the `painted` cover, the `framed` hero, particles).
- **Every pack moves** (`docs/theme-packs.md` §9). Shared and automatic:
  - the hero curtain on scroll (bands part, portrait tilts back in 3D);
  - title and ornament reveals;
  - the gallery unveil;
  - sprites that react to scrolling;
  - `parallax-*` depth layers.
  Per pack: `theme.json → motion` (`exit` + `signature`), which `make check` requires. New motion
  must rest exactly at the old page (scroll 0, `transitionEnd`), so the baselines stay valid.

### The art workflow: what the user means by…

**"I placed the images in the assets folder"** (or "build it"): the user generated a theme's paintings
in Gemini from the latest `PROMPT-<THEME>-ASSETS.md` and dropped them into `assets/` at the repo root.
That folder is a git-ignored inbox. Then:
1. Identify the theme from the newest `PROMPT-*-ASSETS.md` that has no pack yet.
2. **Move** the images to `design/packs/<id>/masters/` so `assets/` is empty again, and rename them by
   content: `cover-bg-portrait`, `cover-bg-desktop`, `hero`, `photo-ring`, `corner-tl`, `petals-sheet`,
   `texture`, and `parallax-back` / `parallax-front` if Prompt 8 was delivered. Gemini's file names are
   meaningless.
3. Measure the art: background colours, the calm zones for text, and the photo-ring opening.
4. Add a recipe to `scripts/build_pack_art.py`, then run `python3 scripts/build_pack_art.py <id>`.
   Check the cut-outs over a light and a dark background. If `texture` is missing or tiles badly, use
   `texture_synth`.
5. Build the pack:
   - `theme.json`: `painted` layout, `framed` hero, and a `motion` block. Pick the `exit` from the
     cover's composition (doors, curtain, part, bloom) and one or two `signature` loops that suit
     the art (drift, sway, shimmer, breathe). If Prompt 8 depth art arrived, also key it into
     `parallax-back` / `parallax-front` slots;
   - `tokens.css`, with colours sampled from the paintings;
   - three OFL fonts that no other pack uses;
   - code-drawn ornaments;
   - `overrides.css`, at most 150 lines;
   - `DESIGN.md`, with cultural notes for a reviewer.
6. Registry entry: a **commercial name** (the look, not the ethnic group, e.g. "Gonjong Songket", not
   "Minang"), a category, a demo slug, and a preview image. Then `make themes`, `make check` and
   `seed_demos`.
7. Visual spec `frontend/tests/visual/packs/<id>.spec.js`. Write the baselines with
   `sh scripts/visual-docker.sh <id>.spec.js --update-snapshots=missing` (the spec file **before** the
   flag). Then verify the full suite **twice, with the machine idle**. The suite includes
   `motion.spec.js`; add the new pack there when its exit differs from the ones it already covers.
8. Show the user screenshots (cover, hero, full page, desktop, plus a frame mid-exit and the hero
   scrolled), fix what looks wrong, and commit on a feature branch. Don't merge or push unless asked.

**"Give me another prompt"**: write `PROMPT-<THEME>-ASSETS.md` for the next theme in
`CATALOG-DIRECTION.md`, using the same structure as the existing prompt files:
- a style brief (Prompt 0), then Prompts 1–7, plus an optional Prompt 8 for depth layers
  (`parallax-back`: a far, pale band sitting on the bottom edge, with a clear top outline, not
  mist fading into the key; `parallax-front`: a few large sprigs cropped at the side edges;
  both on the key colour, with the centre empty);
- a suggested `motion` for the pack (exit + signature), in the prompt's intro;
- exact percentage empty zones for text;
- a separate hero painting with art only in the top and bottom bands;
- cut-outs on one flat key colour that appears nowhere in the palette (cobalt `#2340C8` by default,
  magenta `#D01C8B` if the palette has blue, orange `#F08A00` if it has lilac or violet, which blue
  despill would grey). Ask, twice, for the key to stay flat across the sprite sheet's lower third:
  Gemini keeps adding a haze or ground band there;
- the texture prompt marked optional;
- no people, no text, no religious symbols;
- a note for a cultural reviewer.

### Standing rules
- Don't commit `docker-compose.yml` (the user's local port remap: web 5190, api 8020, db 5440), or
  `RECON.md`, `PHASE0-REPORT.md`, `PROMPT-ASSET-MOTION.md`.
- Never write religious text from memory (see `shared/copy/SOURCES.md`).
- Commit messages end with the Co-Authored-By line used in the history.
- The disk on the dev Mac runs low. Ask before pruning Docker volumes; other caches are OK.

---

# Original build spec (historical)

You are building a digital wedding invitation SaaS platform for the Indonesian market. Read this file fully before writing any code. Follow every instruction here exactly.

---

## Project Structure

```
undangan/
├── backend/
│   ├── manage.py
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── invitations/
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── admin.py
│   │   └── auth_api/
│   │       ├── views.py
│   │       └── urls.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── InvitationPage.jsx
│   │   │   ├── DashboardLogin.jsx
│   │   │   └── DashboardRSVP.jsx
│   │   ├── themes/
│   │   │   ├── ThemeRenderer.jsx
│   │   │   ├── JavaneseDark/
│   │   │   │   ├── index.jsx
│   │   │   │   └── JavaneseDark.css
│   │   │   ├── FloralLight/
│   │   │   │   ├── index.jsx
│   │   │   │   └── FloralLight.css
│   │   │   └── ModernMinimalist/
│   │   │       ├── index.jsx
│   │   │       └── ModernMinimalist.css
│   │   └── components/
│   │       ├── sections/
│   │       │   ├── HeroSection.jsx
│   │       │   ├── CountdownTimer.jsx
│   │       │   ├── EventsSection.jsx
│   │       │   ├── StorySection.jsx
│   │       │   ├── ProfileSection.jsx
│   │       │   ├── GallerySection.jsx
│   │       │   ├── AmplodDigital.jsx
│   │       │   ├── RSVPForm.jsx
│   │       │   ├── WishesWall.jsx
│   │       │   └── MapsSection.jsx
│   │       └── ui/
│   │           ├── MusicPlayer.jsx
│   │           ├── WhatsAppShare.jsx
│   │           └── GuestGreeting.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Tech Stack — Exact Versions

**Backend**
- Python 3.12
- Django 5.0
- djangorestframework 3.15
- djangorestframework-simplejwt 5.3
- django-cors-headers 4.3
- Pillow 10.3 (image handling)
- psycopg2-binary 2.9
- gunicorn 22.0
- python-decouple 3.8

**Frontend**
- React 18.3
- Vite 5.2
- React Router DOM 6.23
- Axios 1.7
- Framer Motion 11 (animations)
- date-fns 3.6 (countdown, date formatting)

**Infrastructure**
- PostgreSQL 16
- Nginx 1.25 (prod)
- Docker + Docker Compose

---

## Backend Instructions

### Django Apps

Create two apps under `backend/apps/`:

**`invitations`** — core app containing all models, serializers, views, admin
**`auth_api`** — JWT login/logout endpoints only

### Models

Implement exactly these models in `invitations/models.py`:

```python
# All models belong to the invitations app

class Invitation(models.Model):
    THEME_CHOICES = [
        ('javanese-dark', 'Javanese Malam Emas'),
        ('floral-light', 'Taman Bunga'),
        ('modern-minimalist', 'Minimalis Putih'),
    ]
    slug = models.SlugField(unique=True, max_length=100)
    theme = models.CharField(max_length=30, choices=THEME_CHOICES, default='javanese-dark')
    is_active = models.BooleanField(default=False)
    wedding_date = models.DateField()
    expires_at = models.DateField()  # auto-set: wedding_date + 90 days
    opening_text = models.TextField(blank=True)
    closing_text = models.TextField(blank=True)
    watermark = models.BooleanField(default=True)
    music_file = models.FileField(upload_to='music/', null=True, blank=True)
    couple_user = models.OneToOneField(
        'auth.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='invitation'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from datetime import timedelta
            self.expires_at = self.wedding_date + timedelta(days=90)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.slug


class Couple(models.Model):
    invitation = models.OneToOneField(Invitation, on_delete=models.CASCADE, related_name='couple')
    bride_name = models.CharField(max_length=200)
    bride_parents = models.CharField(max_length=300)
    bride_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bride_bio = models.TextField(blank=True)
    groom_name = models.CharField(max_length=200)
    groom_parents = models.CharField(max_length=300)
    groom_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    groom_bio = models.TextField(blank=True)


class Event(models.Model):
    EVENT_TYPES = [('akad', 'Akad Nikah'), ('resepsi', 'Resepsi')]
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES)
    datetime = models.DateTimeField()
    venue_name = models.CharField(max_length=300)
    address = models.TextField()
    gmaps_url = models.URLField(blank=True)
    gmaps_embed_url = models.URLField(blank=True)


class Story(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='stories')
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']


class Photo(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='gallery/')
    caption = models.CharField(max_length=300, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']


class BankAccount(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']


class RSVP(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='rsvps')
    guest_name = models.CharField(max_length=200)
    whatsapp = models.CharField(max_length=20, blank=True)
    attending = models.BooleanField()
    pax = models.PositiveIntegerField(default=1)
    wishes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']
```

### Serializers

In `invitations/serializers.py`, create:
- `RSVPSerializer` — all fields, read-only `submitted_at`
- `RSVPCreateSerializer` — writable: guest_name, whatsapp, attending, pax, wishes
- `InvitationPublicSerializer` — nested: couple, events, stories (ordered), photos (ordered), bank_accounts (ordered), plus all invitation fields. Exclude `couple_user`, `is_active`, `created_at`.
- `WishSerializer` — guest_name + wishes + submitted_at only (public wishes wall)

### API Views

In `invitations/views.py`:

```python
# GET /api/invitations/{slug}/ — public, no auth
# Returns 404 if not found, 403 if is_active=False
class InvitationDetailView(RetrieveAPIView):
    ...

# POST /api/invitations/{slug}/rsvp/ — public, no auth
# Validate: pax between 1-10, guest_name required, attending required
# Rate limit: 5 submissions per IP per hour (use django-ratelimit or simple cache check)
class RSVPCreateView(CreateAPIView):
    ...

# GET /api/invitations/{slug}/rsvps/ — JWT auth required, couple_user only
# Returns full RSVP list + summary stats (total_hadir, total_tidak_hadir, total_pax)
class RSVPListView(ListAPIView):
    ...

# GET /api/invitations/{slug}/wishes/ — public, no auth
# Returns only: guest_name, wishes, submitted_at — where wishes is not blank
class WishesListView(ListAPIView):
    ...
```

### URL Patterns

`config/urls.py`:
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.invitations.urls')),
    path('api/auth/', include('apps.auth_api.urls')),
    path('media/', ...),
]
```

`invitations/urls.py`:
```python
urlpatterns = [
    path('invitations/<slug:slug>/', InvitationDetailView.as_view()),
    path('invitations/<slug:slug>/rsvp/', RSVPCreateView.as_view()),
    path('invitations/<slug:slug>/rsvps/', RSVPListView.as_view()),
    path('invitations/<slug:slug>/wishes/', WishesListView.as_view()),
]
```

`auth_api/urls.py`:
```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
urlpatterns = [
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
]
```

### Django Admin

In `invitations/admin.py`, register with these inlines:

```python
class CoupleInline(admin.StackedInline): model = Couple
class EventInline(admin.StackedInline): model = Event, extra=2
class StoryInline(admin.TabularInline): model = Story
class PhotoInline(admin.TabularInline): model = Photo
class BankAccountInline(admin.TabularInline): model = BankAccount

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['slug', 'theme', 'is_active', 'wedding_date', 'expires_at', 'watermark']
    list_filter = ['theme', 'is_active', 'watermark']
    list_editable = ['is_active']
    prepopulated_fields = {'slug': ('couple__bride_name',)}  # hint only
    inlines = [CoupleInline, EventInline, StoryInline, PhotoInline, BankAccountInline]
    actions = ['activate_invitations', 'deactivate_invitations']

@admin.register(RSVP)
class RSVPAdmin(admin.ModelAdmin):
    list_display = ['guest_name', 'invitation', 'attending', 'pax', 'submitted_at']
    list_filter = ['invitation', 'attending']
    readonly_fields = ['guest_name', 'whatsapp', 'attending', 'pax', 'wishes', 'submitted_at']
```

### Settings

`config/settings/base.py` must include:
```python
INSTALLED_APPS = [
    ...django defaults...,
    'rest_framework',
    'corsheaders',
    'apps.invitations',
    'apps.auth_api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...rest of middleware...
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

---

## Frontend Instructions

### Routing (React Router v6)

```jsx
// App.jsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/dashboard" element={<DashboardLogin />} />
  <Route path="/dashboard/:slug" element={<DashboardRSVP />} />
  <Route path="/:slug" element={<InvitationPage />} />
</Routes>
```

Note: `/:slug` must be LAST to avoid catching `/dashboard`.

### InvitationPage.jsx

```jsx
// On mount:
// 1. Read slug from useParams()
// 2. Read `to` from useSearchParams() → guestName
// 3. Fetch GET /api/invitations/{slug}/
// 4. If 403 → show "Undangan belum aktif" message
// 5. If 404 → show "Undangan tidak ditemukan" message
// 6. Pass full `invitation` object + `guestName` to <ThemeRenderer />
```

### ThemeRenderer.jsx

```jsx
// Receives: invitation (object), guestName (string)
// Dynamically renders the correct theme component:
const themes = {
  'javanese-dark': JavaneseDark,
  'floral-light': FloralLight,
  'modern-minimalist': ModernMinimalist,
}
const Theme = themes[invitation.theme] || JavaneseDark
return <Theme invitation={invitation} guestName={guestName} />
```

### Theme Components

Each theme (JavaneseDark, FloralLight, ModernMinimalist) is a full-page React component that:
- Imports its own CSS file
- Receives `{ invitation, guestName }` as props
- Renders ALL section components in order (see PRD Section 6)
- Passes relevant data slices to each section component

Section components live in `components/sections/` and are theme-agnostic in logic but styled by the parent theme's CSS via className conventions.

### Section Components — Props Contract

Each section receives only the data it needs:

```jsx
<HeroSection
  brideName={couple.bride_name}
  groomName={couple.groom_name}
  weddingDate={invitation.wedding_date}
  theme={invitation.theme}
/>

<GuestGreeting guestName={guestName} openingText={invitation.opening_text} />

<CountdownTimer targetDate={events.find(e => e.event_type === 'akad')?.datetime} />

<EventsSection events={invitation.events} />

<StorySection stories={invitation.stories} />

<ProfileSection couple={invitation.couple} />

<GallerySection photos={invitation.photos} />

<AmplodDigital bankAccounts={invitation.bank_accounts} />

<RSVPForm slug={invitation.slug} />

<WishesWall slug={invitation.slug} />

<MapsSection events={invitation.events} />

<MusicPlayer musicUrl={invitation.music_file} />

<WhatsAppShare slug={invitation.slug} brideName={couple.bride_name} groomName={couple.groom_name} />
```

### CountdownTimer.jsx

```jsx
// Uses date-fns or native JS
// Counts down to targetDate (akad datetime)
// Shows: days, hours, minutes, seconds — updating every 1000ms via setInterval
// Cleans up interval on unmount (useEffect return)
// If targetDate has passed, show "Alhamdulillah, hari bahagia telah tiba 🤍"
```

### RSVPForm.jsx

```jsx
// Local state: { guest_name, whatsapp, attending: true, pax: 1, wishes: '' }
// POST to /api/invitations/{slug}/rsvp/
// On success: show thank-you message, hide form
// Validation: guest_name required, pax min 1 max 10
// attending toggle: two buttons (Hadir / Tidak Hadir)
// If attending = false: hide pax field
```

### WishesWall.jsx

```jsx
// GET /api/invitations/{slug}/wishes/ on mount
// Poll every 30 seconds for new wishes
// Render as scrollable list: guest_name (bold), wishes text, time ago
// Show latest 20 wishes max
// Empty state: "Jadilah yang pertama memberikan doa 🤍"
```

### AmplodDigital.jsx

```jsx
// Renders a card per bank account
// Each card has: bank name, account number, account name
// "Salin Nomor" button → navigator.clipboard.writeText(account_number)
// On copy: button text changes to "Tersalin ✓" for 2 seconds then resets
```

### MusicPlayer.jsx

```jsx
// Uses HTML5 <audio> element with autoplay (muted initially to bypass browser policy)
// Floating button bottom-right: music note icon
// On click: toggle muted state (not pause — keep playing, just mute/unmute)
// Visual: pulsing ring animation when unmuted
// Only render if invitation.music_file exists
```

### DashboardRSVP.jsx

```jsx
// Protected route: check JWT in localStorage, redirect to /dashboard if missing
// GET /api/invitations/{slug}/rsvps/ with Authorization: Bearer {token}
// Summary cards:
//   - Total Konfirmasi (count of all RSVPs)
//   - Hadir (count attending=true)
//   - Tidak Hadir (count attending=false)
//   - Total Tamu (sum of pax where attending=true)
// Table columns: Nama, WA, Hadir, Jumlah Tamu, Ucapan, Waktu
// "Export CSV" button → generate CSV from data in-browser (no backend endpoint needed)
// Logout button → clear localStorage, redirect to /dashboard
```

### API Client

```js
// api/client.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
```

### Animations

Use Framer Motion for:
- Section entrance: `initial={{ opacity: 0, y: 40 }}` → `animate={{ opacity: 1, y: 0 }}` with `viewport={{ once: true }}`
- Stagger children in gallery grid and wishes list
- Hero name entrance: fade + scale from 0.95

Do NOT use CSS animations for these — use Framer Motion consistently.

---

## Themes — Visual Specs

### Theme 1: javanese-dark
```css
--bg-primary: #1a1208;
--bg-secondary: rgba(201,168,76,0.06);
--gold: #c9a84c;
--gold-muted: #8a7a5a;
--text-primary: #f5eed6;
--text-muted: #8a7a5a;
--border: rgba(201,168,76,0.2);
--font-display: 'Great Vibes', cursive;
--font-serif: 'Cormorant Garamond', serif;
--font-body: 'Jost', sans-serif;
```
Google Fonts: `Great Vibes`, `Cormorant Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400`, `Jost:wght@300;400;500`

Signature element: SVG kawung batik motif border at top and bottom of page, fading into background.

### Theme 2: floral-light
```css
--bg-primary: #fdf8f5;
--bg-secondary: #f7ede8;
--rose: #c4847a;
--rose-muted: #d4a09a;
--text-primary: #2d1f1c;
--text-muted: #8c6b67;
--border: rgba(196,132,122,0.2);
--font-display: 'Playfair Display', serif;
--font-serif: 'Playfair Display', serif;
--font-body: 'Lato', sans-serif;
```
Google Fonts: `Playfair Display:ital,wght@0,400;0,700;1,400`, `Lato:wght@300;400`

Signature element: Watercolor floral SVG illustration in hero section corners (top-left, bottom-right). Soft pink peonies / roses rendered in SVG with low opacity washes.

### Theme 3: modern-minimalist
```css
--bg-primary: #ffffff;
--bg-secondary: #f5f5f3;
--accent: #1f1f1f;
--sage: #8a9e8a;
--text-primary: #1f1f1f;
--text-muted: #888;
--border: #e0e0dc;
--font-display: 'Cormorant Garamond', serif;
--font-serif: 'Cormorant Garamond', serif;
--font-body: 'Inter', sans-serif;
```
Google Fonts: `Cormorant Garamond:ital,wght@0,300;1,300`, `Inter:wght@300;400;500`

Signature element: Single full-width horizontal rule in sage color between every section. Zero decoration except typography and whitespace. Names displayed in an extremely large, light-weight serif (font-size: 96px, font-weight: 300).

---

## Docker Configuration

### docker-compose.yml (development)

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: undangan_db
      POSTGRES_USER: undangan_user
      POSTGRES_PASSWORD: undangan_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
      - ./media:/app/media
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db

  frontend:
    build:
      context: ./frontend
      target: development
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000/api

volumes:
  postgres_data:
```

### backend/Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## Build Order for Claude Code

Follow this exact sequence. Do not skip steps or reorder.

1. **Scaffold project structure** — create all directories and empty files as shown above
2. **Backend: models** — implement all models in `invitations/models.py`, run makemigrations
3. **Backend: serializers** — implement all serializers
4. **Backend: views + urls** — implement all API views and wire up urls
5. **Backend: admin** — implement Django admin with all inlines
6. **Backend: settings** — base, development, production settings files
7. **Backend: Dockerfile + requirements.txt**
8. **Frontend: project init** — Vite + React, install all dependencies
9. **Frontend: api/client.js** — axios client with JWT interceptor
10. **Frontend: section components** — build all components in `components/sections/` one by one
11. **Frontend: UI components** — MusicPlayer, WhatsAppShare, GuestGreeting
12. **Frontend: Theme JavaneseDark** — full theme wrapping all sections
13. **Frontend: Theme FloralLight** — full theme
14. **Frontend: Theme ModernMinimalist** — full theme
15. **Frontend: ThemeRenderer** — dynamic theme switcher
16. **Frontend: InvitationPage** — fetch + render
17. **Frontend: LandingPage** — static marketing page
18. **Frontend: DashboardLogin** — JWT login form
19. **Frontend: DashboardRSVP** — RSVP dashboard with stats + table + CSV export
20. **Frontend: App.jsx routing**
21. **Docker: docker-compose.yml** — dev compose file
22. **Docker: docker-compose.prod.yml** — prod with nginx
23. **nginx/nginx.conf** — reverse proxy config
24. **.env.example** — all required env vars
25. **README.md** — setup instructions (docker compose up, create superuser, first invitation)

---

## Key Constraints & Rules

- **Never use `create-react-app`.** Use Vite only.
- **No TypeScript.** Plain JavaScript (.jsx/.js) only.
- **No UI component libraries** (no MUI, Ant Design, Chakra). Write all CSS manually per theme.
- **No Redux.** Use React state (useState, useContext) only.
- **The `/:slug` route must be registered LAST** in React Router to avoid swallowing `/dashboard`.
- **All API calls go through `api/client.js`**, never raw fetch.
- **Music autoplay:** use `<audio autoPlay loop>` but start muted. The floating button unmutes, not plays.
- **WhatsApp share URL format:** `https://wa.me/?text=Assalamualaikum, kami mengundang Anda ke pernikahan {brideName} & {groomName}. Lihat undangan kami di: {url}`
- **ADMIN_WHATSAPP_NUMBER** env var is used on the landing page WA button: `https://wa.me/{ADMIN_WHATSAPP_NUMBER}?text=Halo, saya ingin memesan undangan digital`
- **CSV export** on dashboard: generate in-browser from fetched RSVP data, no backend endpoint needed.
- **Rate limiting on RSVP** — simple: check Django cache for IP, max 5 posts/hour. Use `django.core.cache`.
- **`expires_at` check** — in `InvitationDetailView`, if `today > invitation.expires_at`, return 403 with `{"detail": "Undangan telah berakhir"}`.
- **Watermark** — if `invitation.watermark = True`, show a small fixed footer: "Dibuat dengan Undangan Digital" with link to homepage.
- **Images in serializer** — use `SerializerMethodField` to return absolute URLs (request.build_absolute_uri).
- **CORS** — in development, allow `http://localhost:5173`. Set via env var in production.

---

## .env.example

```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgres://undangan_user:undangan_pass@db:5432/undangan_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
MEDIA_ROOT=/app/media
ADMIN_WHATSAPP_NUMBER=628123456789
```

---

## First Run Checklist (for README)

```bash
# 1. Clone and setup
cp .env.example .env
# Edit .env with your values

# 2. Start services
docker compose up --build

# 3. Run migrations
docker compose exec backend python manage.py migrate

# 4. Create superuser (admin)
docker compose exec backend python manage.py createsuperuser

# 5. Access
# Admin panel:  http://localhost:8000/admin/
# Frontend:     http://localhost:5173/
# API:          http://localhost:8000/api/

# 6. Create first invitation
# → Go to admin panel
# → Add Invitation (set slug, theme, wedding_date, is_active=True)
# → Add Couple inline
# → Add Events (akad + resepsi)
# → Add Photos, Stories, BankAccounts
# → Create a User for the couple, assign to couple_user field
# → Visit: http://localhost:5173/{slug}/
```
