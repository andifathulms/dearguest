# Batak — Gorga Ulos

**Intent.** A bold Batak Toba wedding (*ulaon unjuk*) on ivory paper. Elements:
- **gorga**: the carved and painted ornament of the *rumah bolon*, in the Batak three colours (red, black and white);
- the horn-tipped roofline of the rumah bolon;
- **ulos** in Ragi Hotang style, draped and folded with its fringe;
- a woven pandan *tandok*, *hariara* fig leaves and jasmine;
- on wide screens, Lake Toba and the hills of Samosir.

It is the graphic, high-contrast look of *Pesona Nusantara*. Gonjong Songket puts gold on
black lacquer; here the ground is ivory and the red and black are the ornament.

**Art.** Painted with Gemini from `PROMPT-BATAK-ASSETS.md`. The masters are in
`design/packs/batak/masters/`, and `scripts/build_pack_art.py batak` builds the slot
files from them. The cut-outs are keyed from cobalt, with blue despill and `edge_fill`
so the ulos fringe threads have no blue outline. The sprite sheet's hazy lower third is
cropped off.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: the rumah bolon gable and a carved gorga beam across the top, ulos hanging at the sides, an ulos runner with a tandok and jasmine at the foot; desktop has house posts, ulos and leaves at the sides and Lake Toba along the bottom |
| `hero-top` / `hero-bottom` | the hero on phones: a carved gorga beam with three ulos swags; the ulos runner with tandok, leaves and jasmine |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: Lake Toba and Samosir in morning mist, a strip laid on the runner (overrides.css), trailing the scroll (`depth` 0.25). Phones only |
| `parallax-front` | Prompt 8's near layer: fig leaves and an ulos fringe at the side edges, moving ahead of the scroll. Phones only |
| `photo-ring` | a carved gorga oval crowned by a rumah bolon roof point, with a folded ulos at its foot, on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | a carved gorga bracket with a draped ulos and fig leaves, used as a lintel over the closing |
| `particles` | an ulos tassel, a gorga rosette, a fig leaf, jasmine, woven pandan, a hibiscus petal |
| page background | `texture.webp`, seamless ivory paper (set in overrides.css) |

**The lake strip.** Prompt 8a asked for the lake in the bottom 30% of the frame, but it
came back as a strip at 68–83%, with its haze fading out of the cobalt. It is therefore
built as a band, not a cut-out: it is cut below the haze gradient, its top fades into
mist, and its straight lower edge is tucked under the runner.

**Motion.**
- Exit `part`: the roofline and the runner part when the cover opens.
- Signature `sway` and `breathe`: the ulos over the closing sways, and the portrait floats.
- Depth: the lake trails the scroll and the near leaves move ahead of it.

**Type.**
- Rouge Script for the couple's names, event names and profile names.
- Bodoni Moda in spaced capitals for section titles and labels.
- Cardo for body text and the italic lines.

**Ornaments**, drawn in code:
- a double gorga spiral under each section title;
- a wave-of-curls divider;
- an oval monogram frame with a rumah bolon roof on top and an ulos fringe at its foot.

**Cultural notes for a reviewer from Tapanuli / Toba.**
- Ulos is given with meaning (*mangulosi*). Here it is only draped or folded, never worn
  by a figure.
- The gorga is kept to ornamental spirals and curls. Faces, *singa* heads, lizards
  (*boraspati*), breasts (*adop-adop*) and *Desa Naualu* were left out because of their
  protective and cosmological meanings. Would families expect any of them?
- This is a Toba look. Karo, Simalungun, Pakpak, Angkola and Mandailing weddings each have
  their own houses, cloth and colours.
- The art has no religious symbol, no people and no text. The pack's name describes the
  look ("Gorga Ulos"), not the ethnic group.
