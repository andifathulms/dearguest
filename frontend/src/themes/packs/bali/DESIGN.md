# Bali — Jepun Prada

**Intent.** A warm Balinese wedding look on cream paper. Elements:
- the carved *candi bentar* split gate in red brick and grey *paras* stone, with *patra* floral carving;
- *prada* cloth: deep red with gold-leaf florals;
- *jepun* (frangipani) and woven *janur*;
- on wide screens, rice terraces and coconut palms.

It is the tropical, gilded look of *Pesona Nusantara*.

**Art.** Painted with Gemini from `PROMPT-BALI-ASSETS.md`. The masters are in
`design/packs/bali/masters/`, and `scripts/build_pack_art.py bali` builds the slot files
from them. The cut-outs are keyed from cobalt, with blue despill and `edge_fill`. The
sprite sheet's painted steps (its lower third) are cropped off, and the painted paper is
tinted to the paintings' cream.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: the two halves of a candi bentar at the sides, a red-and-gold prada swag with a jepun garland across the top, stone steps with jepun and janur at the foot; desktop has the gate halves over rice terraces |
| `hero-top` / `hero-bottom` | the hero on phones: a carved paras lintel with prada swags; the stone steps with leaves, jepun and janur |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `parallax-back` | Prompt 8's far layer: rice terraces with coconut palms, standing on the hero's foot behind the steps and rising as the hero scrolls (`depth` −0.1). Phones only |
| `parallax-front` | Prompt 8's near layer: frangipani and janur hanging at the side edges, moving ahead of the scroll. Phones only |
| `photo-ring` | a carved paras-stone oval with a gold inner rim, a jepun and janur crest, and a prada swag at its foot, on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | a carved paras corner with draped prada and a jepun spray, used as a lintel over the closing |
| `particles` | white and pink jepun, a jepun petal, woven janur, a leaf, a gold prada motif |
| page background | `texture.webp`, seamless cream paper (set in overrides.css) |

**Motion.**
- Exit `gate`: the cover's two halves slide apart sideways, like the split gate. This
  exit was added for this pack.
- Signature `shimmer` and `sway`: light passes over the prada gold, and the jepun and
  cloth over the closing sway.
- Depth: the terraces rise and the near frangipani moves ahead of the scroll.

**Type.**
- Petit Formal Script for the couple's names, event names and profile names.
- Prata in capitals for section titles and display lines.
- Libre Caslon Text for body text, the italic lines, and labels in semibold capitals.

**Ornaments**, drawn in code:
- a small patra flourish under each section title;
- a four-petal jepun divider;
- an oval monogram frame with a jepun crest and a janur tail at its foot.

**Cultural notes for a reviewer from Bali.**
- The *candi bentar* appears here as a gateway, the way wedding venues and family
  compounds use it. It is also a temple gate.
- Gate faces (*Karang Boma*), offerings (*canang sari*), *penjor*, *tedung* umbrellas,
  shrines and statues were left out because they are religious.
- In Java, *kamboja* (frangipani) is linked to cemeteries; in Bali, *jepun* is everyday
  and festive.
- There are no people and no text in the art. The pack's name describes the look
  ("Jepun Prada"), not the ethnic group or the religion.
