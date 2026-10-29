# Theme packs

A **theme pack** is a folder of design data — tokens, fonts, art, a layout choice and an opening — rendered by one shared invitation layout. Packs change how an invitation *looks*; the sections (and what they contain) are shared components.

Legacy themes (the 36 pre-pack themes, `kind: "legacy"` in the registry) are not packs: they keep their own CSS and are rendered by `themes/legacy/LegacyTheme.jsx`. Nothing in this document applies to them.

- Registry: `shared/themes.json` → synced into backend and frontend by `make themes`; `make check` validates registry + packs.
- Pack runtime: `frontend/src/themes/packs/_system/`; shared styles: `frontend/src/themes/packs/_base/`.

---

## 1. Pack layout

```
frontend/src/themes/packs/<id>/
  theme.json      manifest: layout, opening, slots → assets, fonts, photo filters, (future) copy & events
  DESIGN.md       the pack's design intent — written before any code
  index.js        pack entry chunk: imports the CSS/fonts/manifest/slot components below
  tokens.css      CSS custom properties only (the token contract, §2)
  overrides.css   ≤ 150 lines; whatever tokens can't express
  fonts/          self-hosted woff2, Latin subset (+ fonts.css with @font-face)
  assets/         files referenced by the slot map
  slots/          optional React components that fill a slot (e.g. a code-drawn monogram)
```

A pack's CSS, fonts and art load **only** for invitations using that pack: `index.js` is its own chunk, lazy-loaded by `PackTheme`. All pack CSS is scoped under `.pk-root[data-pack="<id>"]`, so it can't collide with legacy theme CSS (16 legacy files contain unscoped `.cover-gate` rules).

Registry entry for a pack:

```json
{ "id": "minimal", "kind": "pack", "status": "active", "tier": "premium",
  "collection": "signature", "previewImage": "/theme-previews/minimal.webp",
  "demoSlug": "demo-minimal", "demoTemporary": true,
  "catalog": { "desc": "…", "category": "Modern", "colors": […], "swatch": "…", "card": {…} },
  "pack": { "dir": "minimal" } }
```

`status: "coming"` entries may exist before their folder does; every other pack must pass `make check`.

### `theme.json`

```json
{
  "id": "minimal",
  "layoutVariant": "full-bleed",              // framed-card | full-bleed | arch | painted
  "hero": "photo",                            // photo (default) | framed (§3)
  "opening": { "type": "css", "preset": "photo-crossfade-typeon", "durationMs": 1800 },
  "motion": { "exit": "doors", "signature": ["sway", "shimmer"] },   // required (§9)
  "fonts": { "preload": ["fonts/display-300.woff2", "fonts/body-400.woff2"] },
  "photoFilters": ["none", "soft-warm", "bw"],  // offered in the editor; omit to hide the control
  "slots": {
    "texture": { "src": "assets/grain.webp", "width": 256, "height": 256, "blend": "multiply", "opacity": 0.5 },
    "monogram-frame": { "component": "slots/MonogramFrame.jsx" },
    "divider": { "svg": "assets/divider.svg", "width": 120, "height": 12 }
  },
  "copyVariants": ["umum"],                  // reserved: religion/copy variants (not used yet)
  "eventTypes": ["akad", "resepsi"]          // reserved: supported event types (not used yet)
}
```

Slot values are one of:

| Form | Meaning |
|---|---|
| `{ "src": "assets/x.webp", "avif": "assets/x.avif", "fallback": "assets/x.png", "width": W, "height": H }` | raster; rendered as `<picture>` (AVIF → WebP → fallback) with `width`/`height` |
| `{ "svg": "assets/x.svg", "width": W, "height": H }` | SVG inlined so `currentColor` follows the slot's colour token |
| `{ "component": "slots/X.jsx" }` | a React component fills the slot (gets `{ invitation, slot }`) |

Extra per-slot keys (`blend`, `opacity`, `mirror`, `depth`, `frames`, `desktop`) are listed in §4. A raster slot can carry `"desktop": { "src": …, "avif": … }`: a landscape painting served on wide screens (`min-aspect-ratio: 1/1`).

---

## 2. Token contract

Every pack's `tokens.css` defines **all** of these on `.pk-root[data-pack="<id>"]`. `make check` fails on any missing name; the base layer still renders with neutral fallbacks, so a missing token fails the check, not the page.

The list comes from what actually varies between the 28 legacy classic themes, whose CSS falls into three families (dark-gold, light-floral, minimal) with ad-hoc names for the same roles (`--gold` / `--rose` / `--accent` …). Each token below names a role, not a colour.

### Colour

| Token | Role | Legacy equivalents |
|---|---|---|
| `--dg-bg` | page background | `--bg-primary` |
| `--dg-bg-alt` | alternating section background | `--bg-secondary`, `--bg-tint` |
| `--dg-surface` | cards (events, gifts, wishes) | `--card-grad`, `--cream-card`, `--bg-card` |
| `--dg-surface-raised` | inputs, raised controls | — (hard-coded rgba) |
| `--dg-ink` | primary text | `--text-primary` |
| `--dg-ink-muted` | secondary text | `--text-muted` |
| `--dg-ink-faint` | captions, timestamps | `--text-faint` |
| `--dg-accent` | the one signature colour: links, ornaments, focus | `--gold`, `--rose`, `--accent`, … |
| `--dg-on-accent` | text on accent fills | — (hard-coded) |
| `--dg-line` | hairlines, card borders | `--border`, `--hair` |
| `--dg-line-strong` | emphasised rules, active borders | `--border-bright`, `--border-strong` |
| `--dg-scrim` | gradient over photos behind text | `--hero-scrim`, `--lx-scrim` |
| `--dg-focus` | keyboard focus ring | `--brand` |

### Type

| Token | Role |
|---|---|
| `--dg-font-display` | names, section titles |
| `--dg-font-body` | running text, forms |
| `--dg-font-label` | small caps labels ("THE WEDDING OF", dates) |
| `--dg-fs-names` | couple names on cover/hero (use `clamp()`) |
| `--dg-fs-title` | section titles |
| `--dg-fs-subtitle` | card headings (event type, person name) |
| `--dg-fs-body` | body text |
| `--dg-fs-small` | captions, helper text |
| `--dg-fs-label` | caps labels |
| `--dg-lh-tight` / `--dg-lh-body` | line-heights for display / body |
| `--dg-tracking-label` | letter-spacing for caps labels |
| `--dg-weight-display` | weight of the display face (e.g. 300) |

### Shape, space, depth, motion

| Token | Role |
|---|---|
| `--dg-radius-card` / `--dg-radius-button` / `--dg-radius-photo` | corner radii |
| `--dg-space-1` … `--dg-space-6` | spacing scale, small → large |
| `--dg-section-pad-y` | vertical padding of each section |
| `--dg-content-max` | max width of section content |
| `--dg-gutter` | horizontal page padding |
| `--dg-shadow-card` / `--dg-shadow-float` | card shadow / floating-control shadow |
| `--dg-dur-fast` / `--dg-dur-base` / `--dg-dur-slow` | durations (hover / entrances / opening beats) |
| `--dg-ease` | default easing |
| `--dg-stagger` | delay between staggered items |

---

## 3. Layout variants

Set by `theme.json → layoutVariant`; applied as `data-layout` on the pack root.

| Variant | Cover | Hero | Typical pack |
|---|---|---|---|
| `framed-card` | centred card on `cover-bg`, framed by `cover-frame` | photo (if any) behind a scrim, names centred | Javanese, Floral |
| `full-bleed` | the hero photo fills the screen; names set over a scrim | same photo continues as the hero | Minimal |
| `arch` | card clipped to an arch window over `cover-bg` | photo shown inside an arch (`photo-mask`) | adat themes with gates/windows |
| `painted` | the `cover-bg` painting is the cover (no card, no photo); text in its calm centre | — | Floral |

**Hero mode** (`theme.json → hero`), independent of the cover layout:

- `photo` (default): the couple's photo fills the hero behind a scrim (the variants above).
- `framed`: the hero is painted and the couple's photo sits in `photo-ring` above the names. On portrait screens, `hero-top` / `hero-bottom` bands are pinned to the section's top and bottom. The section grows to fit its content, so the flowers never cover the names; the pack sets the padding from the bands' painted heights. `hero-bg` is the painting for wide screens, or for every screen if there are no bands.

All variants use the same sections in the same order: greeting, countdown, events, story, profiles, gallery, gift, RSVP, wishes, maps, livestream, share, closing, watermark.

---

## 4. Asset slots

`<ThemeAsset slot="…" />` renders a slot from `theme.json`. **An unfilled slot renders nothing and reserves no space**; every slot is either absolutely positioned or purely decorative, so the layout is identical with or without art.

Dimensions are given in **CSS pixels at @1x** (the box the slot occupies on a 390 px-wide phone) and the **@2x file to deliver**. Deliver rasters at @2x; the build serves them to all densities. For painted art, also keep a master at ≥ 3× (not shipped).

z-order (bottom → top): `cover-bg` / `hero-bg` (0) · `hero-top` / `hero-bottom` (1) · `parallax-back` (1) · `parallax-mid` (2) · `texture` (3) · `parallax-front` (4) · photos (5) · `hero-overlay` / `photo-ring` (6) · `corner-*` / `cover-frame` (7) · text (10) · `particles` (11) · `opening` (100).

| Slot | Purpose & position | Format | @1x box | @2x file | Colour | Notes |
|---|---|---|---|---|---|---|
| `cover-bg` | full-screen background behind the cover / opening | AVIF + WebP (+ JPEG fallback), opaque; or SVG | 390×844 (covers; cropped centre) | 1080×2340 portrait; optional desktop 2560×1440 (`srcDesktop`) | full colour | `object-fit: cover`, focal point centre-top; keep important detail inside the central 80 % |
| `texture` | tileable paper / cloth / film-grain overlay on the page | WebP (PNG fallback), may be greyscale | tile 256×256 | 512×512, **≤ 60 KB**, seamless on all edges | `blend` (`multiply` / `overlay` / `soft-light`) + `opacity` | `pointer-events: none`; repeats over the whole invitation |
| `cover-frame` | ornamental frame around the cover card | SVG line art, or WebP alpha if painted/carved | 340×520 (card aspect ≈ 0.65) | 680×1040 | SVG: `currentColor` = `--dg-accent` | stretches to the card; keep corners ornamental and edges simple (they scale) |
| `corner-tl` | top-left corner art on cover, hero and the closing section | WebP alpha (painted) or SVG | 180×180 (max 46 % viewport width) | 360×360 (master 900×900) | full colour, or `currentColor` if SVG | anchored to the corner, art bleeding off the edges is fine |
| `corner-br` | bottom-right corner art | as `corner-tl` | 180×180 | 360×360 | as above | omit and set `"mirror": true` on `corner-tl` to reuse it rotated 180° |
| `monogram-frame` | frame around the couple's initials (cover, closing, between profiles) | SVG line art or `component` | 120×120 | vector | `currentColor` | initials are rendered as text inside; leave the centre 60 % empty |
| `heading-ornament` | small ornament under each section title | SVG | 120×24 | vector | `currentColor` | single colour; horizontally symmetric |
| `divider` | ornament between sections | SVG | up to 320×24 (content width) | vector | `currentColor` | single colour; renders centred |
| `photo-mask` | shape for profile (and arch-layout hero) photos | SVG, one closed path, black fill | viewBox 0 0 400 500 (4:5) | vector | — | applied with CSS `mask-image`; photo is cropped `object-fit: cover` |
| `photo-ring` | ornament around profile photos | WebP alpha or SVG | 220×275 (4:5, matches mask + 10 % margin) | 440×550 | full colour or `currentColor` | sits above the photo; transparent centre |
| `hero-overlay` | painted elements over the hero photo's edges (garland, foliage, frame) | WebP alpha | 390×844 | 780×1688 | full colour | anchored bottom; keep the centre clear for names |
| `hero-bg` | `framed` hero: the painting behind it (wide screens when bands exist) | AVIF + WebP + JPEG, opaque | 390×844 | 1080×2340, or landscape 1920×1080 | full colour | `object-fit: cover`; centre clear |
| `hero-top` / `hero-bottom` | `framed` hero on portrait screens: painted bands pinned to the top / bottom | WebP / AVIF with alpha (inner edge fades out) | 390 wide | 1080 wide | full colour | cut from one painting by `scripts/build_pack_art.py` |
| `parallax-back` / `-mid` / `-front` | depth layers in the hero (static on a `framed-card` cover) | WebP alpha | 390×844 each | 1080×2340 each | full colour | `depth`: how far the layer trails the scroll, default 0.4 / 0.2 / −0.15 (0 moves with the page, 1 stands still, negative moves ahead; the offset is a fraction of a screen height, so a thin strip the pack's CSS places moves as much as a full-frame layer); each must read on its own; still under reduced motion (§9) |
| `particles` | falling sprites (petals, jasmine, dust) | WebP alpha, 4–6 files (`frames: [...]`, plus `count`, `size` in px) | 32×32 | 64–96 px each | full colour | CSS fall + sway + spin, fixed positions (same every render), above the cover, `pointer-events: none`; none under reduced motion |
| `opening` | the opening animation (§5) | Lottie JSON ≤ 150 KB (no embedded images over 30 KB), or layered SVG with named `<g id>` layers | full screen | artboard 1080×1920, 30 fps, ≤ 3 s | full colour | the final frame must look like the cover's end state |
| `gift-card` | face of bank / QRIS / e-wallet cards | SVG or WebP alpha | 320×200 | 640×400 | full colour | text is rendered on top; keep the centre-left calm |
| `og-template` | background for the per-invitation WhatsApp preview image | PNG / JPEG | — | **1200×630**, safe area centre 900×330 for names + date | full colour | used by the server-side share-image renderer (later phase) |

### Slot debug

In development, add `?slots=1` to any invitation URL. Every slot is outlined and labelled with its name, the size it renders at (CSS px) and whether it is **filled** or **empty**; empty slots draw a dashed box at the nominal @1x size above. Use it to check commissioned art against this table.

---

## 5. Openings

`theme.json → opening.type`:

| Type | What it is | Assets |
|---|---|---|
| `none` | cover with an "open" button; no animation | — |
| `css` | code-driven sequence named by `preset` (e.g. `photo-crossfade-typeon`) | none required |
| `lottie` | plays the `opening` slot's Lottie file; the player (`lottie-web`, light build) is lazy-loaded only for packs that use it | `opening` (Lottie JSON) |
| `layered-svg` | animates named `<g id>` layers of the `opening` SVG using a preset table | `opening` (SVG) |

Every opening shares one contract (`useOpeningGate`), the same one the legacy cover follows: the page is scroll-locked (`body.cover-open`) and the open button focused until the guest opens it; opening dispatches `invitation:open` **synchronously inside the click** (that's what lets background music start under browser autoplay rules); `?preview=1` (editor preview) skips it; a tap anywhere skips to the end; `prefers-reduced-motion` shows the end state immediately. In development `?openingAt=0.5` pins the animation at 50 % for screenshots.

---

## 6. Photo filters

Packs listing `photoFilters` in `theme.json` get a "Filter foto" control in the editor. The choice is stored on the invitation (`photo_filter`: `none` | `soft-warm` | `bw`) and applied as `data-photo-filter` on the pack root; `_base/filters.css` maps each to a CSS `filter` on hero, profile, gallery and lightbox images.

---

## 7. Loading rules

- Fonts: self-hosted woff2 in the pack, Latin subset, `font-display: swap`; the faces listed in `fonts.preload` get `<link rel="preload">` as soon as the pack starts loading. No Google Fonts in packs.
- The cover/hero photo is a real `<img fetchpriority="high">` with `width`/`height`, never a CSS background.
- Rasters always carry `width`/`height` (no layout shift); everything below the fold is `loading="lazy"`.
- A pack adds no runtime JS beyond the shared pack system, except a `lottie` opening's player chunk.

## 8. Adding a pack

1. Add the registry entry (`status: "coming"`), run `make themes`.
2. Write `packs/<id>/DESIGN.md`.
3. Create `theme.json`, `tokens.css` (all tokens), `index.js`, fonts, assets.
4. `?slots=1` to place art; `make check` until green.
5. Choose the pack's `motion` block (§9); `make check` fails without it.
6. Flip `status` to `active`, `make themes`, add the demo (`demoSlug`), run the visual suite.

**Painted art from an image model** (how Floral was made; `PROMPT-FLORAL-ASSETS.md`):

1. Generate the paintings into the repo's `assets/` inbox (git-ignored).
2. Move them to `design/packs/<id>/masters/` (kept; they're the source).
3. Add a recipe for the pack in `scripts/build_pack_art.py` and run `python3 scripts/build_pack_art.py <id>`. A recipe lists:
   - **opaque** images: resized, AVIF/WebP/JPEG;
   - **bands**: cut and edge-faded;
   - **keyed** cut-outs: removed from a flat background, closed so dark petals stay solid, with no colour fringe;
   - **sprites**: a sheet split into particles;
   - a seamless **texture** tile.
4. Check the cut-outs over a light background, not only over the page colour; see-through dark petals only show there.

## 9. Motion

Every pack moves. Most of it is shared and automatic; each pack only picks its cover exit and its signature loops.

**Automatic, every pack, no configuration:**

| Effect | What happens | Where |
|---|---|---|
| Hero curtain | as the guest scrolls past the hero, `hero-top` rises, `hero-bottom` sinks, `hero-bg` (or the photo) trails the page and the framed portrait tilts back in 3D | `_system/HeroMotion.jsx` |
| Depth layers | filled `parallax-*` slots move at their `depth` (§4); empty ones render nothing | `_system/HeroMotion.jsx` |
| Section titles | the title rises out of a mask, then the `heading-ornament` draws from its centre | `components/sections/SectionTitle.jsx` |
| Gallery | each photo's frame unveils from its centre while the photo settles from a slight zoom, staggered | `GallerySection.jsx`, `_system/motion.js` |
| Sprite wind | the `particles` layer lifts and leans against the scroll's velocity, then settles | `_system/Particles.jsx` |

**Per pack, `theme.json → motion`** (required; `make check` validates it):

```json
"motion": { "exit": "doors", "signature": ["sway", "shimmer"] }
```

`exit`: how the cover leaves when the guest taps the open button (`_system/openings/CoverExit.jsx`). The text fades first, then:

| Exit | Movement | Suits |
|---|---|---|
| `doors` | two halves swing open towards the guest, in 3D | carved doors, gebyok, rumah gadang |
| `curtain` | two halves gather to the sides | drapes, a lamming canopy |
| `gate` | two halves slide apart sideways | a split gate (candi bentar) |
| `part` | the top and bottom halves part | clouds above and below, a roofline over a runner |
| `bloom` | the cover grows and fades, as if walking through it | florals, anything without a natural split |
| `fade` | a plain fade | the fallback; also what reduced motion gets |

`signature`: one or two ambient loops that suit the art (`_base/motion.css`):

| Signature | Movement | Needs |
|---|---|---|
| `drift` | the hero bands (and the wide painting) float slowly sideways | clouds, mist, water |
| `sway` | the closing's hanging corner art moves in a breeze | melati strings, leaves, tassels |
| `shimmer` | a light sweeps across the gold of `hero-top` and the photo frame | gold, silk, songket |
| `breathe` | the framed portrait floats, barely | any pack |

Current packs: Gebyok Sogan `doors` + sway, shimmer; Gonjong Songket `doors` + shimmer, breathe; Lamming Zamrud `curtain` + shimmer, sway; Siger Mega Mendung `part` + drift, sway; Merah Anggur and Taman Sage `bloom` + sway, breathe.

**Rules for anything new here:**
- **Rest = the old page.** Every effect is the identity at rest: scroll-linked values are 0 at the top of the page, reveals end at `transform: none` / `clip-path: none` (Framer `transitionEnd`), loops start invisible or at identity. That is why the visual baselines didn't change when motion was added, and why screenshots (which disable animations) stay stable.
- **Reveals animate opacity too.** `tests/visual/packs/stub.js` `waitRevealed` waits for inline opacity 1, so a reveal that moves opacity with its other properties is waited for automatically.
- **No second reveal layer on items a section already animates** (an IntersectionObserver class or a CSS scroll timeline on the same elements fights Framer and leaves items stuck hidden). Wrap, or animate an element nothing else animates.
- **Cheap properties only** (transform, opacity, clip-path; the sheen's moving background is one small pseudo-element), no scroll listeners outside Framer's, no WebGL: guests open these links in WhatsApp's in-app browser on mid-range phones.
- **Depth art (optional):** a prompt's Prompt 8 asks for `parallax-back` / `parallax-front` cut-outs on the key colour; build them as `keyed` entries in the recipe and add the slots to `theme.json`. They start moving with no code.
- **Reduced motion:** Framer's `MotionConfig reducedMotion="user"` plus `useReducedMotion()` switch reveals to plain fades, freeze the hero, make the exit a fade; the loops only exist under `prefers-reduced-motion: no-preference`.
- **Behaviour is tested** in `tests/visual/packs/motion.spec.js` (exit, curtain at rest and on scroll, reveals ending at rest, reduced motion).
