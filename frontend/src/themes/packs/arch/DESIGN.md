# Arch — Lengkung Pasir

**Intent.** The first *Modern & Minimalis* pack: clean and editorial, but still painted.
Elements:
- one tall **plaster arch** in warm sand, lit by late sun, with soft shadows across it;
- a single **olive branch** drawn in fine ink line with a light wash;
- a small **terracotta** bud vase with one white flower;
- in the hero, a pale colonnade with two cypresses, seen through the arch.

It is architecture and light rather than flowers, so it breaks from the corner-bouquet
cover the live florals share. Pampas Kraft is also warm beige, but it is dried flowers on
kraft paper; this one is plaster, line and shadow, with almost no colour.

**Art.** Painted with Gemini from `PROMPT-ARCH-ASSETS.md`. The masters are in
`design/packs/arch/masters/`, and `scripts/build_pack_art.py arch` builds the slot files
from them. The cut-outs are keyed from cobalt, with blue despill and `edge_fill` for the
fine line work. The painted texture is tinted to the paintings' plaster.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: one deep arch seen straight on, the olive branch climbing its left rim, the vase on the sill; desktop has a central arch between the shadow of a second arch and a vase on a plaster bench |
| `hero-top` / `hero-bottom` | the hero on phones: the arch's curved top with an olive sprig; its sill with the vase. Between them overrides.css repeats `hero-mid.webp`, a slice of plain rim and plaster, so the arch stays whole at any height (it is a file, not a slot) |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: a pale colonnade and two cypresses, inside the arch between the names and the sill, trailing the scroll (`depth` -0.1). Phones only |
| `parallax-front` | Prompt 8's near layer: two olive branches down the side edges, pushed past them, moving ahead of the scroll. Phones only |
| `photo-ring` | an arch-shaped frame (a fine gold line and a band of plaster) with an olive sprig and one white flower; the portraits are cut to the same arch |
| `corner-tl` (mirrored to `corner-br`) | one olive branch from the corner, used as a light lintel over the closing |
| `particles` | two olive leaves, a white petal, an olive twig, a terracotta petal, a white flower |
| page background | `texture.webp`, the painted plaster (set in overrides.css) |

**Delivered differently from the prompt.**
- The hero's arch rim runs the full height, so it can't be cut into two bands alone; see
  `hero-mid` above.
- The cover's branch reaches ~30 % into the opening. Phones crop the painting's sides, so
  the cover text sits a little right of centre to clear it.
- The sprite sheet came 2 across × 3 down (`sprites_grid`).
- No section art (S1-S4) or scene art (C1-C4) yet: the pack renders without them.

**Motion.**
- Exit `bloom`: the cover grows and fades, as if walking through the arch.
- Signature `breathe` only: the arched portrait floats, barely. Nothing else loops, so the
  page stays quiet.
- Depth: the colonnade trails the scroll, the near branches move ahead of it.

**Type.**
- Instrument Serif: italic for the couple's names, event names and profile names; roman
  for section titles; italic for the greeting and the closing.
- Manrope for body text and labels (widely spaced capitals).
- Ms Madi only for the ampersand.

**Ornaments**, drawn in code:
- a small hairline arch between two rules under each section title;
- a divider of two leaves between rules;
- an arched monogram frame with an olive sprig at its foot.

**Notes for a reviewer.**
- This theme has no regional or religious elements, no people and no text.
- Does the arch read as modern and elegant rather than as a mosque or church doorway, for
  couples of every faith?
- Is the page too quiet for an Indonesian wedding, or is that the point for the couples
  who choose it?
- The pack's name describes the look ("Lengkung Pasir").
