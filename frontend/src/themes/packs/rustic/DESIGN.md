# Rustic — Pampas Kraft

**Intent.** A warm, earthy garden or barn wedding on hand-made kraft paper. Elements:
- creamy pampas plumes and bunny-tail grass;
- dried flowers: terracotta and dusty-rose roses, rust strawflowers, wheat and ruscus;
- muted eucalyptus;
- jute twine bows.

It is the *Taman & Bunga* look between Taman Sage (fresh and white) and Merah Anggur
(dark and dramatic), and the outdoor *kebun* style many couples ask for.

**Art.** Painted with Gemini from `PROMPT-RUSTIC-ASSETS.md`. The masters are in
`design/packs/rustic/masters/`, and `scripts/build_pack_art.py rustic` builds the slot
files from them. The cut-outs are keyed from cobalt with blue despill and `edge_fill`:
Gemini painted the pampas hair tips with cobalt mixed in, which left a dark fringe on
kraft, so those strokes fade and the soft edge takes the plume's own colour. A blurred
patch of the corner's background is cleared before keying (`clear`), and the sprite
sheet's hazy lower third is cropped off (`sprites_crop`).

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: a pampas and dried-rose spray across the top right, a smaller one tied with twine at the bottom left; desktop has sprays on both sides |
| `hero-top` / `hero-bottom` | the hero on phones: a pampas swag gathered with a twine bow and two roses; a low meadow of grasses, wheat and strawflowers |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `photo-ring` | an open twine wreath with pampas and roses at the lower left and a strawflower at the upper right, on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | a pampas spray with a dusty rose, used as a lintel over the closing |
| `particles` | terracotta and dusty-rose petals, a eucalyptus leaf, a pampas tuft, a wheat head, a strawflower |
| page background | `texture.webp`, seamless kraft paper (set in overrides.css) |

**Motion.** Exit `bloom`: a loose spray has no natural split. Signature `sway` and
`breathe`: grasses in a breeze, a floating portrait.

**Type.**
- Sacramento for the couple's names, section titles, event names and profile names.
- Fraunces (soft) for display lines, and in small bold capitals for labels.
- Alegreya for body text and the italic lines.

**Ornaments**, drawn in code:
- a wheat sprig under each section title;
- a twine-bow divider;
- an oval twine monogram frame with a wheat sprig on top and a bow at its foot.

**Notes for a reviewer.** The theme has no regional or religious elements, and no
people or text in the art. Please check two things:
- that the dried-flower palette reads as warm and festive, not faded or mournful;
- that it suits a garden or outdoor reception as Indonesian couples picture one.
