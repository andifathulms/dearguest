# Tropis — Anggrek Bulan

**Intent.** A lush tropical garden on warm white paper, for garden, beach and resort
weddings. Elements:
- white **anggrek bulan** (moth orchid, *Phalaenopsis amabilis*, one of Indonesia's
  national flowers), with a few blush-pink ones;
- big **monstera**, **banana** and **palm** leaves in deep and fresh greens, with a few
  fine gold veins;
- small accents of coral **heliconia**;
- on wide screens and in the hero, a pale line of coconut palms in the distance.

It is the bright, green look of *Taman & Bunga*. Merah Anggur also has anggrek bulan, but
on wine velvet; Jepun Prada has frangipani, so frangipani stays out of this one.

**Art.** Painted with Gemini from `PROMPT-TROPIS-ASSETS.md`. The masters are in
`design/packs/tropis/masters/`, and `scripts/build_pack_art.py tropis` builds the slot
files from them. The cut-outs are keyed from cobalt, with blue despill and `edge_fill`
for the palm leaflets and the monstera holes. No texture was delivered: `texture.webp` is
generated in code (`texture_synth`) in the paintings' own paper white, with a faint
grain.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: a monstera, banana and orchid canopy across the top, a palm, monstera, blush orchid and heliconia bed at the bottom right; desktop has leaf walls at the sides and coconut palms along the bottom |
| `hero-top` / `hero-bottom` | the hero on phones: the same canopy (a V, deepest at the edges); a bed of leaves with blush orchids and heliconia at both corners |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: pale coconut palms and shrubs, standing on the bed, trailing the scroll (`depth` -0.1). They fade out toward the sides and at their torn-paper lower edge (overrides.css). Phones only |
| `parallax-front` | Prompt 8's near layer: monstera and banana leaves hanging from the top, moving ahead of the scroll. Phones only |
| `photo-ring` | a fine gold ring wound with small leaves, white orchids and a heliconia at the lower left, blush orchids at the upper right; on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | monstera, palm and banana leaves with an arching orchid spray, used as a lintel over the closing |
| `particles` | a white orchid, a blush petal, a monstera leaf, a palm leaflet, a heliconia bract, a green leaf with a gold vein |
| `section-edge` | section art: a column of monstera and palm with white and blush moth orchids and heliconia, at the sides of the sections (smaller on phones, beside the wide titles) |
| `section-garland` | section art: a swag of monstera, palm and heliconia with moth orchids, the divider between sections |
| `monogram-wreath` | section art: a ring of palm fronds and monstera with a crescent of moth orchids and heliconia at the bottom, around the initials |
| `card-corner` | section art: an L-shaped palm frond with one white moth orchid, on the event and gift cards |
| page background | `texture.webp`, generated warm white paper (set in overrides.css) |

**Delivered differently from the prompt.**
- The canopy runs deeper than asked: ~34 % of the height in the centre and ~40 % at the
  sides (26 % was asked). The cover and hero text sit lower to match.
- The far palms end in a torn-paper edge above more key, not at the image's bottom edge.
  They are cut out whole and faded at that edge.
- The near layer is a full canopy across the top, not two side clusters. It is pushed
  past the edges so the centre stays clear above the portrait.

**Motion.**
- Exit `curtain`: the huge leaves gather to the sides when the cover opens.
- Signature `drift` and `sway`: a slow breeze in the hero bands, and the leaves over the
  closing move.
- Depth: the palms trail the scroll and the near leaves move ahead of it.

**Type.**
- Ephesis for the couple's names, event names and profile names.
- DM Serif Display for section titles.
- Newsreader for labels (spaced capitals), body text and the italic lines.

**Ornaments**, drawn in code:
- two leaves and a bud under each section title;
- a divider of two leaf shapes and a dot;
- an oval monogram frame with a small moth orchid at its crown and crossed leaves at its
  foot.

**Cultural notes for a reviewer.**
- This theme has no regional or religious elements, no people and no text.
- Does the anggrek bulan read as festive and Indonesian, rather than as a generic
  "tropical resort" look?
- Do the tropical greens suit couples outside Bali and away from beach venues?
- The pack's name describes the look ("Anggrek Bulan"), not a place or group.
