# Palembang — Limas Emas

**Intent.** A regal Palembang wedding in deep maroon lacquer and gold. Elements:
- the carved, gilded panels, stepped floor and double doors of the *rumah limas*;
- *songket limar*: red with dense gold thread and a gold fringe;
- *lak* (Palembang lacquerware) florals and a lacquered *tepak sirih*;
- *cempaka* and jasmine;
- on wide screens, the Musi river at dawn with stilt houses.

It is the most opulent look in *Pesona Nusantara*. Gonjong Songket puts gold on black
lacquer; this one is gold on maroon, with florals instead of roof horns.

**Art.** Painted with Gemini from `PROMPT-PALEMBANG-ASSETS.md`. The masters are in
`design/packs/palembang/masters/`, and `scripts/build_pack_art.py palembang` builds the
slot files from them. The cut-outs are keyed from cobalt, with blue despill and
`edge_fill`. The river is real blue-grey water, so it is keyed `plain`, with no blue
clean-up. This is the first sprite sheet that came back with no haze band, so it needs no
crop.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: a carved gilded lintel with a songket swag, carved gold side panels, the stepped floor with a tepak sirih and cempaka at the foot; desktop has the rumah limas doors open on the Musi river |
| `hero-top` / `hero-bottom` | the hero on phones: the lintel with three songket swags; the floor step with cempaka and jasmine |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: the Musi river with stilt houses, lying behind the floor and rising as the hero scrolls (`depth` −0.1). Phones only |
| `parallax-front` | Prompt 8's near layer: songket drapes at the top corners, moving ahead of the scroll. Phones only |
| `photo-ring` | a carved gilded oval with lak florals, a cempaka crest and a folded songket at its foot, on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | a carved gilded corner with songket and cempaka, used as a lintel over the closing |
| `particles` | cempaka flower and petal, jasmine, a gold lak motif, a songket tassel, a leaf |
| `section-edge` | section art: a carved gold panel hung with red songket, cempaka and melati, at the sides of the sections (smaller on phones, beside the wide titles) |
| `section-garland` | section art: a carved gold-on-maroon bar with a cempaka and melati posy, the divider between sections |
| `monogram-wreath` | section art: a carved gold ring with cempaka and a swag of red songket at the bottom, around the initials |
| `card-corner` | section art: a carved gold-on-maroon bracket with a cempaka bud, on the event and gift cards |
| page background | `texture.webp`, seamless maroon lacquer (set in overrides.css) |

**Motion.**
- Exit `doors`: the cover swings open like the carved doors.
- Signature `shimmer` and `breathe`: light runs over the gold, and the portrait floats.
- Depth: the river rises and the drapes move ahead of the scroll.

**Type.**
- Lavishly Yours for the couple's names, event names and profile names.
- Abhaya Libre SemiBold in capitals for section titles and display lines.
- Source Serif 4, cut at its text optical size, for body text, the italic lines and the
  semibold labels.
- Light text gets a soft shadow on the dark lacquer.

**Ornaments**, drawn in code:
- a small lak flower under each section title;
- a tendril divider with a gold diamond;
- an oval monogram frame with a cempaka crest and a songket fringe at its foot.

**Cultural notes for a reviewer from Palembang.**
- *Aesan gede*, *paksangko* and *tanjak* are left out because they are worn. The songket
  is only draped or folded.
- *Teratai* (lotus), common in Palembang carving, is left out because of its religious
  associations elsewhere; *cempaka* and jasmine are used instead.
- Is the deep maroon *lak* recognisably Palembang, rather than generic Malay?
- There are no people and no text in the art. The pack's name describes the look
  ("Limas Emas"), not the ethnic group.
