# Minimal — Photo-led

**One line:** the couple's photographs are the art; everything else gets out of their way.

This pack replaces the intent of the legacy `modern-minimalist`, `beige-korean` and `mono-editorial` themes. It is the reference pack for the theme-pack system: it needs no commissioned illustration, so every decision here is typography, space, photo treatment and motion.

## Who it's for

Couples with a good prewedding shoot who want the invitation to feel like a printed photo book or an editorial spread rather than a decorated card. Likely city couples, 25–35, sharing on WhatsApp to a mixed list (family + friends). It must still read as *warm* to an older relative — minimal, not cold.

## Principles

1. **Photo first.** The cover *is* the couple's photo, full-bleed. No frames, no corners, no flourishes over a face.
2. **Quiet type, large.** Names set big and light, never bold, never script. Hierarchy comes from size and space, not weight or colour.
3. **One accent, used rarely.** A muted clay used for small ornaments, the ampersand and section labels — never for large fills.
4. **Space is the ornament.** Generous section rhythm; one restrained ornament per heading and between sections, both hairline SVG in `currentColor`.
5. **Film, not filter.** A fine grain over the whole page ties photos and paper together; couples can choose *Asli*, *Hangat lembut* or *Hitam putih* for all photos at once.
6. **No emoji, no gradients-as-decoration, no gold.**

## Palette

| Role | Token | Value | Note |
|---|---|---|---|
| Page | `--dg-bg` | `#f6f2ec` | warm off-white paper |
| Alternating | `--dg-bg-alt` | `#efe9e1` | one step darker, for rhythm |
| Card | `--dg-surface` | `#fbf8f4` | barely lifted from the page |
| Ink | `--dg-ink` | `#1d1b18` | warm near-black |
| Muted | `--dg-ink-muted` | `#5e574e` | body copy, ≥ 7:1 on `--dg-bg` |
| Faint | `--dg-ink-faint` | `#8d857a` | timestamps, captions (≥ 3:1, large/secondary only) |
| Accent | `--dg-accent` | `#9a7b66` | muted clay; ornaments, ampersand, labels |
| Lines | `--dg-line` | `rgba(29,27,24,.12)` | hairlines only |

Over photos, text is white on a bottom-weighted scrim (`--dg-scrim`) tuned so names stay ≥ 4.5:1 on the lightest part of a typical bright outdoor photo.

## Type

Two OFL pairings are evaluated side by side (cover + a content section, 360 px and 1440 px) before choosing; both self-hosted, Latin-subset woff2:

- **A — Cormorant Garamond Light (300) + Inter (400/500).** High-contrast Garalde at a light weight; elegant at display sizes, very "printed invitation". Inter is neutral and legible at small sizes on cheap Android screens.
- **B — Newsreader Light (300, display optical size) + Manrope (400/500).** Contemporary editorial serif with sturdier hairlines; Manrope is rounder and friendlier.

Decision and screenshots: see *Type decision* below.

Scale (mobile → desktop): names `clamp(3rem, 15vw, 6.5rem)`; section titles `clamp(2rem, 7.5vw, 3rem)`; body 16 px; labels 11 px caps, tracking 0.24em. Display weight 300 throughout; italic display for the greeting and closing.

## Space

Section padding `clamp(4.5rem, 14vw, 8rem)` vertical; content max 760 px; gutter 24 px. The spacing scale is 4 / 8 / 16 / 24 / 40 / 64. Alternate sections sit on `--dg-bg-alt` to give the long scroll a rhythm without rules.

## Photo treatment

- **Cover / hero:** full-bleed, `object-fit: cover`, faces assumed in the upper half; bottom-weighted scrim for the names.
- **Grain:** generated tileable monochrome noise (`assets/grain.webp`, 256 px tile, ≤ 60 KB) over the whole page with `multiply` at low opacity — it sits on photos *and* paper so they feel like one material.
- **Filters** (editor, per invitation): `none` (Asli), `soft-warm` (Hangat lembut: slight sepia, lower saturation and contrast), `bw` (Hitam putih: full greyscale, slightly lifted contrast).
- **Gallery:** editorial grid — every five photos: one wide (3:2, full width), two tall (4:5), one landscape (4:3, two-thirds) and one small portrait (3:4, one-third). Never uniform tiles.
- **Profiles:** tall 4:5 portraits, square corners, no rings.

## Ornament

- **Monogram:** the couple's initials in the display face inside a code-drawn fine-line frame — a thin square rotated 45° inside a circle, `currentColor`, 1 px at 92 px. Used on the cover, between the two profiles and at the closing.
- **Heading ornament:** a 28 px hairline with a 3 px dot centred on it.
- **Divider between sections:** none — space alone, plus the `--dg-bg-alt` alternation. (The divider slot stays empty on purpose.)

## Motion

- **Opening (`css`, preset `photo-crossfade-typeon`, 1.8 s):** the cover photo resolves from the paper colour (opacity + 6 % scale settle) over the first half; the names type on letter by letter from 32 % to 87 %; the label, date, guest name and the open button rise in last. A tap anywhere skips to the end; reduced motion shows the end state.
- **Sections:** fade + 32 px rise on entering the viewport, once, 700 ms ease-out.
- Nothing loops except the music button's slow pulse while music plays.

## Slots used

| Slot | Filled with |
|---|---|
| `texture` | `assets/grain.webp` (generated) |
| `monogram-frame` | `slots/MonogramFrame.jsx` (code-drawn SVG) |
| `heading-ornament` | `assets/heading.svg` (hairline + dot) |
| everything else | intentionally empty |

## Demo content

The demo (`demo-minimal`) currently uses the repository's seed photos (Western stock couple). **Temporary** — to be replaced with a licensed Indonesian prewedding set before the pack is marketed.

## Type decision

**B — Newsreader Light + Manrope.** Compared side by side on the cover and two content sections at 360 px and 1440 px (`docs/theme-packs/screens/minimal-type-pairing-360.jpg`, `-1440.jpg`):

- Over the cover photo, Cormorant's hairlines thin out at mobile sizes and lose contrast against a bright background; Newsreader's light weight keeps enough stroke to stay crisp over photos and on low-DPI Android screens, while still reading as light and quiet.
- Manrope holds up better than Inter at the 11 px caps label size and has a slightly warmer, rounder voice that suits "warm, not cold".
- Cormorant Garamond is already the display face of ~17 legacy themes and of most competing products; Newsreader gives the pack its own voice.
- B is also slightly smaller: 68 KB for four files vs 72 KB.

Pairing A remains a fine fallback if the brand later wants a more traditional, "engraved" look.
