# DearGuest — Phase 1 report: theme packs + Minimal reference pack

Branch `feat/theme-packs`. **Not merged, not pushed.**

## Results

- **Branch base:** branched from `fix/phase-0`, not `main`. `main` (local `f570b12`, `origin/main` `90d88df`) contains neither Phase 0 nor the 19 `feat/motion-layer` commits; you chose this base when asked.
- **Your local files are untouched:** the `docker-compose.yml` port remap and the untracked `RECON.md`, `PHASE0-REPORT.md` and `PROMPT-ASSET-MOTION.md` are in no commit. The two lines this phase needed in `docker-compose.yml` (`VITE_SHOW_HIDDEN_THEMES`) were staged against HEAD only.
- **Gates (all run at the end on a freshly restarted dev server):**

| Gate | Result |
|---|---|
| `make check` (registry + token contract) | ✓ 39 themes (1 active, 2 coming, 36 hidden) |
| Backend suite (`make test`) | ✓ 63 tests (Phase 0's 45 + 18 new) |
| Linux visual suite (`make visual`): Minimal + editor preview + openings, Chromium & WebKit × 360/390/1440 | ✓ 54/54, stable across one update + three independent compare runs |
| Legacy pixel proof, 36 themes × cover + hero at 360×800 | ✓ 71/72 identical; the 72nd is run-to-run noise (below) |
| Existing macOS suites (`themes`, `motion`, `themes3d`) | ✓ 38 passed. Same single failure as before this branch: `demo-bugis` has never had committed baselines |

## Commits

| # | Commit | Scope |
|---|---|---|
| 1 | `9e132e1` | chore(themes): `shared/themes.json` + sync/check scripts + generated copies + `Makefile` |
| 2 | `47ce433` | feat(themes): backend reads the registry; only active themes selectable (migration 0028, state-only) |
| 3 | `83d8a8a` | feat(themes): frontend reads the registry; `data/themes.js` and five other lists removed; `VITE_SHOW_HIDDEN_THEMES` |
| 4 | `5bd4818` | refactor(themes): one `LegacyTheme` instead of 28 copied components; `COVER_CLASS` removed |
| 5 | `0232ff7` | docs(themes): `docs/theme-packs.md`, the pack contract |
| 6 | `7bda6f5` | feat(packs): opening system (`none` / `css` / `lottie` / `layered-svg`) + `lottie-web` (lazy) |
| 7 | `2045abd` | feat(packs): pack system core (PackTheme, slots, base layer, layouts, inert section hooks, hero `<img>`) |
| 8 | `7c27b49` | feat(packs): `?slots=1` debug overlay |
| 9 | `1375ec2` | feat(invitations): `photo_filter` field (migration 0029) + editor control |
| 10 | `fcc0a77` | docs(minimal): `DESIGN.md` + type-pairing comparison |
| 11 | `00464f4` | feat(minimal): the Photo-led Minimal pack |
| 12 | `b515609` | perf(packs): gzip text in nginx, parallel font preload, no Google Fonts on invitations |
| 13 | `d3c7c84` | test(visual): Linux Docker suite (Chromium + WebKit, 3 sizes) + editor-preview test |
| 14 | `52e4ac2` | test(packs): lottie + layered-svg openings verified with fixture animations |
| 15 | `1a5e841` | test(themes): default-theme test independent of the shipped registry |
| 16 | `b1f8a98` | test(visual): Jakarta timezone, true mid-opening shot, stable WebKit reveals |

**Differences from the approved plan:**
- The opening system landed one commit *before* the core, because the core imports it.
- No separate `chore(seed)` commit was needed: `seed_demos` already reads the registry, so `demo-minimal` appeared as soon as Minimal became active.
- The perf commit (12) is new. The budget measurement found the problems it fixes; see §4.

---

## 1. Final structure

```
shared/themes.json                     ← the one theme list (edit this, then `make themes`)
scripts/sync_themes.py                 → backend/apps/invitations/theme_registry.json
                                       → frontend/src/themes/registry.json   (both generated)
scripts/check_themes.py                ← `make check`: copies in sync, schema, legacy files exist, pack contract

backend/apps/invitations/themes.py     registry access + "active unless unchanged" validation
frontend/src/themes/
  registry.js                          selectableThemes() / catalogThemes() / getTheme() / themeName() …
  ThemePreview.jsx                     catalogue tile (legacy tp-* preview, pack screenshot, or registry mock)
  ThemeRenderer.jsx                    legacy → LegacyTheme / own WebGL component; pack → PackTheme
  legacy/LegacyTheme.jsx, extras.jsx   the 28 classic themes, once (CSS files untouched)
  <LegacyDir>/<LegacyDir>.css          unchanged legacy CSS; 8 WebGL dirs keep their index.jsx
  packs/
    _system/  PackTheme · ThemeContext · ThemeAsset · SlotDebug · Monogram · layout/Cover · openings/*
    _base/    base.css (tokens only) · variants.css · filters.css · openings.css
    minimal/  theme.json · DESIGN.md · index.js · tokens.css · overrides.css (83 lines)
              fonts/ (4 woff2 + fonts.css + LICENSE.md) · assets/ (grain.webp, heading.svg) · slots/MonogramFrame.jsx
frontend/public/theme-previews/minimal.webp   catalogue preview (31 KB)
docs/theme-packs.md                    the contract: tokens, theme.json, layouts, slots, openings, loading
```

**Registry entry** (`shared/themes.json`): `id`, `name`, `collection`, `kind` (pack | legacy), `status` (active | hidden | coming), `tier` (data only), `previewImage`, `demoSlug`, `demoTemporary`, plus:
- `catalog`: desc, category, colours, swatch, onboarding card colours, legacy preview class;
- `legacy`: CSS dir, `ownComponent`, root class, **cover class**, extras, motion clock;
- `pack`: dir.

**`theme.json`** (per pack): `layoutVariant`, `gallery`, `opening {type, preset, durationMs}`, `fonts.preload`, `photoFilters`, `slots`. It also has room for the out-of-scope items: `copyVariants` and `eventTypes` are declared but not used yet.

**Token contract:** the full list with roles and the legacy names it replaces is in [`docs/theme-packs.md` §2](docs/theme-packs.md):
- 13 colour tokens
- 13 type tokens
- 3 radii
- 9 spacing tokens
- 2 shadows
- 5 motion tokens

A pack missing any token fails `make check`. The page still renders, falling back to neutral defaults in `_base/base.css`.

## 2. Slot specification (illustrator appendix)

This is the same table as [`docs/theme-packs.md` §4](docs/theme-packs.md), the copy to keep in sync.
- **Units:** "@1x box" is the CSS-pixel box on a 390 px-wide phone. "@2x file" is what to deliver. Keep painted masters at ≥ 3×; they aren't shipped.
- **Empty slots:** an unfilled slot renders nothing and reserves no space.
- **Z-order, bottom → top:**
  - 0: `cover-bg`
  - 1: `parallax-back`
  - 2: `parallax-mid`
  - 3: `texture`
  - 4: `parallax-front`
  - 5: photos
  - 6: `hero-overlay` / `photo-ring`
  - 7: `corner-*` / `cover-frame`
  - 10: text
  - 11: `particles`
  - 100: `opening`

| Slot | Purpose & position | Format | @1x box | @2x file | Colour | Notes |
|---|---|---|---|---|---|---|
| `cover-bg` | full-screen background behind cover/opening | AVIF + WebP (+ JPEG), opaque; or SVG | 390×844 (cover-cropped, centre) | 1080×2340 portrait; optional desktop 2560×1440 | full colour | keep key detail in the central 80 % |
| `texture` | tileable paper / cloth / film grain over the page | WebP (PNG fallback), may be greyscale | tile 256×256 | 512×512, **≤ 60 KB**, seamless all edges | `blend` (multiply / overlay / soft-light) + `opacity` | repeats over everything; no pointer events |
| `cover-frame` | ornamental frame around the cover card | SVG line art, or WebP alpha if painted / carved | 340×520 (≈ 0.65) | 680×1040 | SVG: `currentColor` = `--dg-accent` | stretches to the card: ornament in corners, plain edges |
| `corner-tl` | top-left corner art on cover + hero | WebP alpha (painted) or SVG | 180×180 (≤ 46 % viewport width) | 360×360 (master 900×900) | full colour / `currentColor` | may bleed off the edges |
| `corner-br` | bottom-right corner art | as above | 180×180 | 360×360 | as above | or `"mirror": true` on `corner-tl` to reuse it rotated 180° |
| `monogram-frame` | frame around the couple's initials (cover, between profiles, closing) | SVG line art or `component` | 120×120 | vector | `currentColor` | initials are live text; keep the centre 60 % empty |
| `heading-ornament` | ornament under each section title | SVG | 120×24 | vector | `currentColor` | single colour, symmetric |
| `divider` | ornament between sections | SVG | ≤ 320×24 | vector | `currentColor` | single colour, centred |
| `photo-mask` | shape for profile (and arch-layout hero) photos | SVG, one closed path, black fill | viewBox 0 0 400 500 (4:5) | vector | — | applied with CSS `mask-image` |
| `photo-ring` | ornament around profile photos | WebP alpha or SVG | 220×275 (4:5, mask + 10 % margin) | 440×550 | full colour / `currentColor` | transparent centre; sits above the photo |
| `hero-overlay` | painted elements over the hero photo's edges | WebP alpha | 390×844 | 780×1688 | full colour | anchored bottom; centre clear for names |
| `parallax-back` / `-mid` / `-front` | depth layers behind cover/hero | WebP alpha | 390×844 each | 1080×2340 each | full colour | `depth` 0.1 / 0.25 / 0.4; each reads alone; off under reduced motion |
| `particles` | floating sprites (petals, jasmine, dust) | WebP alpha, 4–6 files | 32×32 | 64×64 each | full colour | none under reduced motion |
| `opening` | the opening animation | Lottie JSON ≤ 150 KB (no embedded image > 30 KB) or layered SVG with named `<g id>` layers | full screen | artboard 1080×1920, 30 fps, ≤ 3 s | full colour | last frame = the cover's end state; layered-svg layer ids per preset (`door-left`/`door-right`/`glow`, `seal`/`flap`/`letter`, `layer-back`/`-mid`/`-front`) |
| `gift-card` | face of bank / QRIS / e-wallet cards | SVG or WebP alpha | 320×200 | 640×400 | full colour | text renders on top; calm centre-left |
| `og-template` | background for the WhatsApp share image | PNG / JPEG | — | **1200×630**, names/date safe area centre 900×330 | full colour | for the server-side share-image renderer (later phase) |

**Checking delivered art:** open any pack invitation in dev with `?slots=1`. Every slot is outlined with its name, the size it renders at, and filled/empty status; empty slots show a dashed box at the nominal size above.

## 3. Screenshots

All of these are generated from the committed Linux baselines (Chromium unless noted):

| | |
|---|---|
| Minimal at 360 px: mid-opening, cover, hero, every section | [`docs/theme-packs/screens/minimal-360.jpg`](docs/theme-packs/screens/minimal-360.jpg) |
| Minimal at 390 px | [`minimal-390.jpg`](docs/theme-packs/screens/minimal-390.jpg) |
| Minimal at 1440 px | [`minimal-1440.jpg`](docs/theme-packs/screens/minimal-1440.jpg) |
| WebKit vs Chromium at 390 (opening-mid, cover, hero) | [`minimal-webkit-vs-chromium-390.jpg`](docs/theme-packs/screens/minimal-webkit-vs-chromium-390.jpg) |
| Type pairing A vs B, 360 and 1440 | [`minimal-type-pairing-360.jpg`](docs/theme-packs/screens/minimal-type-pairing-360.jpg), [`-1440.jpg`](docs/theme-packs/screens/minimal-type-pairing-1440.jpg) |
| Legacy before/after (javanese, floral, minimalis, navy, bugis, golden-3d) | [`legacy-before-after.jpg`](docs/theme-packs/screens/legacy-before-after.jpg) |
| Every individual baseline (84 PNGs) | `frontend/tests/visual/packs/__screenshots__/minimal.spec.js/` |

### Legacy pixel-identity proof

**Method:**
- 36 legacy demos, cover then opened hero, at 360×800, host Chromium.
- Same flow as `themes.spec`; the motion clock is pinned at frame 180.
- The 8 WebGL themes have their `<canvas>` masked, since the scenes run on real time and this phase only touched their cover class.
- "Before" was captured twice before any code change, to measure run-to-run noise.

Full table: [`docs/theme-packs/legacy-pixel-proof.txt`](docs/theme-packs/legacy-pixel-proof.txt).

| Comparison | Result |
|---|---|
| before vs before (noise) | 71/72 identical; `demo-floral` cover 359 px (0.12 %), max channel Δ 5 |
| before vs after collapse | 71/72 identical + the same `demo-floral` 359 px |
| after vs after (noise) | `demo-teal` cover 347 px, Δ 4, seen only between two *after* runs |
| before vs final (all 16 commits, fresh server) | **71/72 identical**; the 72nd is the same `demo-floral` 359 px |

**Tolerance and why:**
- The only differing pixels are the run-to-run noise measured *before* any change: ≤ 0.13 % of one image, channel Δ ≤ 5.
- They're always in the same 116×17 px box, the animated shimmer on the "Buka Undangan" label.
- Everything else is byte-for-byte identical.

## 4. Budgets: measured vs target

**Setup:**
- Production build (`vite build`), served with gzip like the prod nginx.
- Fixture API and photos served over real HTTP, so every byte is throttled.
- Lighthouse "slow 4G" (150 ms RTT, 1.6 Mbps down, 750 kbps up) plus 4× CPU slowdown, 360×800 @2x, fresh cache.
- Median of 5 runs.

| Budget | Target | Measured |
|---|---|---|
| Pack CSS (gzip) | ≤ 15 KB | **5.4 KB**: shared pack base 4.0 KB + Minimal 1.4 KB |
| Fonts (total) | ≤ 120 KB | **71.4 KB**: 4 woff2, Newsreader 300 / 300i + Manrope 400 / 500 |
| JS added by the pack | none beyond shared bundle | **1.2 KB gzip** (Minimal chunk 0.8 + manifest 0.4); the shared pack runtime is 3.0 KB gzip, loaded only for pack invitations |
| Above-the-fold weight, excl. hero photo | ≤ 350 KB | **230.8 KB**: JS 139.9 · fonts 71.4 · CSS 9.9 · grain 7.0 · API 1.9 · HTML 0.8 |
| LCP (reported) | — | 3.15 s median, on the cover names over the photo |
| Cover intro finished (reported) | — | 4.07 s from navigation |

**What the measurement found and fixed** (commit `b515609`):
- **No text compression in production.** nginx had no `gzip` directive, so JS was served raw (426 KB, now 140 KB). This affects every invitation, legacy too.
- **Google Fonts on every invitation.** The invitation loading/error screen and the app's route fallback used Inter and Playfair Display from the global stylesheet, so every invitation downloaded about 69 KB of fonts before its theme arrived. They now use system fonts.
- **Pack fonts fetched twice.** The font preload fired after the pack chunk had loaded, so it raced the pack's own CSS. It now starts in parallel with the chunk download.

## 5. How to add the Javanese pack once assets arrive

The registry entry already exists (`javanese`, status `coming`). File by file:

1. **`frontend/src/themes/packs/javanese/DESIGN.md`:** write the intent first. Base it on RECON §3.4-A: gebyok arch frame, parang/sidomukti border, melati garland, gunungan opening, sogan palette. Include the cultural notes the reviewer signs off on.
2. **`theme.json`:**
   - `layoutVariant: "arch"` for the gebyok window, or `"framed-card"`;
   - `opening: { "type": "lottie" }` if the gunungan arrives as Lottie, or `"layered-svg"` + `"preset": "doors-part"` if it arrives as layers named `door-left`/`door-right`/`glow`;
   - `slots`: every delivered asset;
   - `fonts.preload`, plus `photoFilters` if wanted.
3. **`tokens.css`:** every `--dg-*` token on `.pk-root[data-pack='javanese']`. `make check` lists any that are missing.
4. **`fonts/`:**
   - Instance and subset the chosen OFL faces exactly as `minimal/fonts/LICENSE.md` records.
   - Use `DG Javanese …` family names in `fonts.css`.
   - Add a `LICENSE.md`.
5. **`assets/`:** deliveries named to match the slot table, e.g. `cover-bg.avif` + `.webp` + `.jpg`, `cover-frame.webp`, `corner-tl.webp`, `texture.webp` (≤ 60 KB), `heading.svg`, `divider.svg`, `opening.json` or `opening.svg`.
6. **`slots/`:** only for code-drawn slots, such as a kawung monogram frame.
7. **`overrides.css`:** at most 150 lines (the check enforces it).
8. **`index.js`:** copy `minimal/index.js` unchanged. Its globs pick up `assets/` and `fonts/`.
9. **Place and check the art:** run the dev stack, then open `/<a javanese invitation>?slots=1` and compare every slot against §2.
10. **Activate:**
    - set `"status": "active"` and `"demoSlug": "demo-javanese-pack"` in `shared/themes.json`;
    - run `make themes`, `make check`, then `docker compose exec backend python manage.py seed_demos`.
11. **Tests:**
    - Copy `tests/visual/packs/minimal.spec.js` to `javanese.spec.js`, with a fixture whose `theme` is `javanese`.
    - Run `make visual-update`, review the PNGs, then `make visual` twice to confirm stability.
12. **Catalogue preview:** capture `public/theme-previews/javanese.webp` (720×1560) and set `previewImage`.

The legacy `javanese-dark` theme stays as it is for its existing invitations.

## 6. What I'd change for Javanese and Floral after building Minimal

1. **Commission Floral as layered source files and set its palette variants in tokens.** "One Floral pack, four palettes" fits the current system (palette = tokens), but painted rasters don't follow `currentColor`. Ask for separable layers (petals / leaves / shadows) so recolouring is a re-export, not a repaint, or accept one fixed palette per art set.
2. **Ask for Lottie openings with real vector shapes, not embedded bitmaps.** Lottie files with large embedded images defeat the 150 KB cap. If the illustrator can only deliver raster frames, use `layered-svg` with WebP layers.
3. **Decide copy variants before Javanese ships.** The shared hero still renders the Bismillah and "We Are Getting Married" for every pack, and the opening still says "The Wedding Of". `theme.json` has room (`copyVariants`), but a Javanese pack for a non-Muslim Javanese couple, or a Christian Batak pack later, needs it.
4. **Fix the timezone bug before the Bugis or any WITA/WIT pack.** In the Linux container the suite rendered "Akad 01:00 WIB" until I pinned Asia/Jakarta: the app formats times in the guest's timezone and labels them WIB.
5. **Plan `framed-card`/`arch` covers with a fallback.** Minimal relies on the couple's own photo. Javanese and Floral covers rely on `cover-bg`, so with no art yet they would show a plain card. Keep both packs `coming` until assets exist; don't ship them half-filled.
6. **Use the editor's photo-filter control as the template for pack-specific options.** It reads `theme.json`. If Javanese wants options (e.g. motif colour), extend the same pattern rather than adding per-pack editor code.
7. **Use Minimal's budget as the baseline.** Minimal reached 231 KB above the fold with almost no art. A painted pack will add `cover-bg` (≈ 150–250 KB AVIF at 1080×2340) and corners. Ask for AVIF + WebP from the start; the 350 KB target excludes only the couple's photo, not the art.

## 7. Known issues and open items

- **Minimal's demo photos are temporary.** `demo-minimal` uses the repo's Western stock seed photos (`demoTemporary: true` in the registry), and so does the catalogue preview image. Replace both with a licensed Indonesian prewedding set before marketing.
- **Only Minimal is active.** Onboarding, the editor and `/tema` now offer Minimal plus "Segera hadir" Javanese/Floral, and the landing counts "1 Tema" (copy unchanged, as decided). In dev, `VITE_SHOW_HIDDEN_THEMES=1` lists the legacy themes.
- **One legacy-visible change outside themes:** the invitation loading/error screen and the route fallback now use system fonts. Covers and heroes are pixel-identical (proof above).
- **Still on the recon list, out of scope here:** Inter as the global `body` font, the render-blocking Google Fonts stylesheet in `index.html` (1.7 KB, no font files load on pack pages now), the timezone bug, and Islamic copy hard-coded in the shared hero.
- **WebKit in-view reveal:** at 360 px, WebKit sometimes skipped the in-view reveal after an instant programmatic scroll. The tests nudge with wheel events; real scrolling doesn't hit it, but check on a real iPhone.
- **The Docker suite needs the dev stack running** (it targets the `frontend` dev service) and pulls `mcr.microsoft.com/playwright:v1.61.1-noble` (≈ 2 GB) on first use. Baselines total 16 MB; per-section shots hide the static grain to keep them small.
- **Vite's file watcher inside Docker on macOS missed edits twice.** It served a stale module until the frontend container restarted. Every verification here was re-run after `docker compose restart frontend`. If you see "my change didn't apply", restart the container, or add `server.watch.usePolling` to `vite.config.js`.
- **Small UI notes:**
  - `fetchpriority` is written lowercase (React 18.3 passes it through to the DOM).
  - Slot-debug labels for full-screen slots overlap at the top-left corner.
  - `lottie-web`'s light build doesn't support After Effects expressions; tell the motion designer.
- **Your dev environment:**
  - Migrations 0028 (state-only) and 0029 (`photo_filter`) are applied to your dev DB.
  - `seed_demos` was re-run, adding `demo-minimal` and resetting the seeded demos to their standard content.
  - The dev stack is running on your remapped ports.
