# Lavender — Wisteria Lila

**Intent.** A soft, romantic pastel garden on white watercolour paper. Elements:
- long hanging wisteria in lilac and pale violet;
- lavender sprigs, white sweet peas and pale lilac roses;
- silver-sage leaves with a touch of silver;
- on wide screens, a wisteria-covered arbour over a pale lavender field.

It is the light, dreamy look of *Taman & Bunga*, for couples who ask for "ungu / lilac".

**Art.** Painted with Gemini from `PROMPT-LAVENDER-ASSETS.md`. The masters are in
`design/packs/lavender/masters/`, and `scripts/build_pack_art.py lavender` builds the
slot files from them. The cut-outs are keyed from **orange**:
- lilac and violet carry more blue than red, so a blue key's despill would turn them grey;
- magenta is too close to the purples.

There is no despill. `edge_fill` recolours the soft edge from the petals and fades strokes
whose colour leans towards orange (Gemini anti-aliased the field's skyline and some
petal edges with the key). The painted paper is tinted to the paintings' white
(`texture_tint`).

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: a wisteria canopy across the top, longer at the sides, and a lavender, sweet-pea and sage bed at the foot; desktop has a wisteria arbour over a pale field |
| `hero-top` / `hero-bottom` | the hero on phones: the wisteria canopy, and the lavender bed |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: a pale lavender field with a row of wisteria arbours, a soft backdrop behind the names, rising as the hero scrolls (`depth` −0.1). Phones only |
| `parallax-front` | Prompt 8's near layer: long racemes hanging at the side edges, moving ahead of the scroll. Phones only |
| `photo-ring` | an open silver wreath wound with wisteria and sage, with a lilac rose and sweet peas at the lower left, on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | a branch with three hanging racemes, used as a lintel over the closing |
| `particles` | a wisteria floret, lilac and sweet-pea petals, a lavender sprig, a sage leaf, a rose petal |
| page background | `texture.webp`, seamless white watercolour paper (set in overrides.css) |

**The far field.** Prompt 8a asked for the field on the bottom edge. As with Batak, it
came mid-frame (62–79%), but this time with a clean top outline, so it is a cut-out. The
faint ghost racemes above it are cropped off, and a CSS mask fades its straight lower edge.

**Motion.** Exit `bloom`. Signature `sway` (the hanging wisteria over the closing) and
`breathe`. Depth: the field rises and the near racemes move ahead of the scroll.

**Type.**
- Allison for the couple's names, event names and profile names.
- Tenor Sans in spaced capitals for section titles and display lines (Italiana was tried first; its hairlines broke up at phone sizes, "H" reading as "II").
- Gentium capitals for labels.
- Gentium Book Plus for body text and the italic lines.

**Ornaments**, drawn in code:
- a small hanging raceme under each section title;
- a wisteria-sprig divider;
- an oval monogram frame with a raceme crest and a lavender sprig at its foot.

**Notes for a reviewer.** The theme has no regional or religious elements, and no people
or text in the art. Please check two things:
- that the pastel lilac reads as romantic and festive, not faded or mournful;
- whether wisteria, which is known in Indonesia through Japanese and Korean styling,
  feels aspirational rather than foreign.
