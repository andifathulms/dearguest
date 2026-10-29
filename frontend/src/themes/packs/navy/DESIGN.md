# Navy — Mawar Malam

**Intent.** White blooms on deep navy paper, like a garden by moonlight. Elements:
- white garden roses, peonies and ranunculus, with baby's breath;
- dusty-blue eucalyptus and silver-green leaves, with fine gold veins;
- on wide screens, white flowering shrubs fading into the dark.

It is the cool counterpart to Merah Anggur (wine and blush): the dark, elegant look of
*Taman & Bunga*, suited to evening receptions.

**Art.** Painted with Gemini from `PROMPT-NAVY-ASSETS.md`. The masters are in
`design/packs/navy/masters/`, and `scripts/build_pack_art.py navy` builds the slot files
from them. The cut-outs are keyed from **magenta**: the palette is navy and dusty blue,
so cobalt can't be used, and there is no pink in the art.

There is no despill. `edge_fill` recolours white petal edges from the petals and fades
magenta-leaning strokes. Its threshold is tighter than the default (`spill`), so the
shrubs' mist, which fades into the key, loses its pink. The sprite sheet's hazy lower
third is cropped off, and the painted paper is tinted to the paintings' navy.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: a garland of white roses and eucalyptus across the top right, a smaller cluster at the bottom left; desktop has tall arrangements at both sides over moonlit shrubs |
| `hero-top` / `hero-bottom` | the hero on phones: a symmetrical garland; a low bed of ranunculus, baby's breath and leaves |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: moonlit shrubs behind the bed, dimmed to read as distant mist (the text over them is light), rising as the hero scrolls (`depth` −0.1). Phones only |
| `parallax-front` | Prompt 8's near layer: white roses and eucalyptus at the side edges, moving ahead of the scroll. Phones only |
| `photo-ring` | an open wreath on a fine gold ring, with white roses at the lower left and a ranunculus at the upper right, on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | a white rose spray, used as a lintel over the closing |
| `particles` | rose and peony petals, a eucalyptus leaf, baby's breath, a gold-veined leaf, a ranunculus |
| page background | `texture.webp`, seamless navy paper (set in overrides.css) |

**Motion.**
- Exit `part`: the top garland lifts and the bed sinks.
- Signature `sway` and `shimmer`: the roses over the closing sway, and light catches the
  gold of the top band and the ring.
- Depth: the shrubs rise and the near roses move ahead of the scroll.

**Type.**
- Corinthia (bold, for legibility) for the couple's names, event names and profile names.
- Aboreto's wide capitals for section titles and display lines.
- Castoro for body text, the italic lines, and labels in semibold capitals.
- Light text gets a soft shadow on the dark paper.

**Ornaments**, drawn in code:
- a small open rose under each section title;
- a wave divider with baby's-breath dots;
- an oval monogram frame with a rose crest and a baby's-breath sprig at its foot.

**Notes for a reviewer.** The theme has no regional or religious elements, and no people
or text in the art. Please check whether a dark navy invitation reads as elegant and
celebratory, or as too sombre.
