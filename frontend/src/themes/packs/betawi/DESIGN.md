# Betawi — Kembang Kelapa

**Intent.** A festive Betawi wedding on warm cream paper, the lightest and most cheerful
look in *Pesona Nusantara*. Elements:
- the front of a **rumah kebaya**: a jade-green beam with a **gigi balang** valance (a row
  of pointed wooden teeth), louvred **jalusi** doors, and a **langkan** railing of turned
  balusters with a **tumpal** (pucuk rebung) band on its rail;
- tall **kembang kelapa**, the paper-and-foil flower trees that line a Betawi procession,
  in red, cerise, marigold and gold;
- brass hanging lamps, strings of **melati** and red **mawar**;
- in the hero, a pale row of kampung roofs with their own gigi balang, behind the railing.

Limas Emas and Gonjong Songket are red and gold on dark grounds, Lamming Zamrud is deep
green; this one is cream with jade and festive colour. Ondel-ondel are left out on
purpose: they are figures, and the set has no people or figures.

**Art.** Painted with Gemini from `PROMPT-BETAWI-ASSETS.md`. The masters are in
`design/packs/betawi/masters/`, and `scripts/build_pack_art.py betawi` builds the slot
files from them. The cut-outs are keyed from cobalt, with blue despill and `edge_fill`
for the thin streamers. The painted texture is tinted to the paintings' cream.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: the gigi balang valance and two lamps across the top, a kembang kelapa at each side, the langkan railing and scattered petals at the foot; desktop has open jalusi doors with a kembang kelapa in front of each |
| `hero-top` / `hero-bottom` | the hero on phones: the valance, lamps and a melati swag; the railing with a small kembang kelapa at each corner. The railing band's paper is lifted out, so the far roofs show between the balusters |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: pale kampung roofs and palms, standing behind the railing and rising as it sinks (`depth` -0.1). Phones only |
| `parallax-front` | Prompt 8's near layer: two large kembang kelapa at the side edges, pushed half off screen, moving ahead of the scroll. Phones only |
| `photo-ring` | a fine gold ring wound with melati and paper flowers, fuller at the bottom, with a tumpal band along the lower curve; on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | a short gigi balang valance with a spray of paper flowers, streamers and hanging melati, used as a lintel over the closing |
| `particles` | red, cerise and marigold paper flowers, a melati bud, a rose petal, a curl of gold foil |
| page background | `texture.webp`, the painted cream paper (set in overrides.css) |

**Delivered differently from the prompt.**
- The hero painting is the cover again with a small kembang kelapa added at each foot, so
  the tall kembang kelapa at the sides (~24-55 % of the height) are left out of the bands
  and only their poles show rising behind the railing.
- The far roofs fill ~45 % of the painting, not 28 %. They are kept down to ~78 % and
  placed behind the railing.
- The sprite sheet came 2 across × 3 down (`sprites_grid`).
- No section art (S1-S4) or scene art (C1-C4) yet: the pack renders without them.

**Motion.**
- Exit `gate`: the symmetrical cover splits down the middle and the halves slide apart,
  like the *palang pintu* that bars the door until the groom's party is let in.
- Signature `sway` and `shimmer`: the streamers over the closing move in a breeze, light
  runs across the gold.
- Depth: the roofs trail the scroll behind the railing, the near kembang kelapa move
  ahead of it.

**Type.**
- Dancing Script (medium) for the couple's names, event names and profile names.
- Yeseva One for section titles.
- Gelasio for labels (spaced capitals), body text and the italic lines.

**Ornaments**, drawn in code:
- a short run of gigi balang teeth either side of a paper flower under each section title;
- a divider of two tumpal runs and a dot;
- an oval monogram frame with a paper flower at its crown and a tumpal band at its foot.

**Cultural notes for a reviewer from the Betawi community.**
- No people, no ondel-ondel, no text, no religious symbols, no landmarks (no Monas).
- Do the gigi balang, the rumah kebaya veranda and the kembang kelapa read as Betawi at
  first glance, without ondel-ondel? Should the kembang kelapa's colours follow a set
  convention?
- Does a gate that opens (after the *palang pintu*) suit the cover, or is that ceremony
  too specific to show?
- Do the brass lamps and the melati swag belong on a Betawi veranda?
- The pack's name describes the look ("Kembang Kelapa"), not the group.
