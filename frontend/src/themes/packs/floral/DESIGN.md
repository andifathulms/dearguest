# Floral — Merah Anggur

**Intent.** A printed luxury invitation on wine velvet: hand-painted peonies,
moth orchids (the white *anggrek bulan*, Indonesia's national flower) and melati
jasmine, with antique-gold lettering. The paintings carry the mood; the page
stays calm so the couple's names and details read clearly.

**Art** (painted with Gemini from `PROMPT-FLORAL-ASSETS.md`; masters in
`design/packs/floral/masters/`, slot files built by `scripts/build_pack_art.py floral`):

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: flowers top and bottom, names in the calm centre |
| `hero-bg` | the hero painting behind the framed portrait |
| `photo-ring` | oval wreath around the hero portrait and both profile photos |
| `corner-tl` (mirrored to `corner-br`) | frames the closing words |
| `particles` | six falling sprites: two peony petals, jasmine, orchid petal, eucalyptus leaf, jasmine bud |
| `section-edge` | section art: wine and dusty-rose peonies, white moth orchids, jasmine and trailing amaranthus, at the sides of the sections |
| `section-garland` | section art: peonies, orchids, jasmine and eucalyptus with amaranthus tails, the divider between sections |
| `monogram-wreath` | section art: small peonies, orchids, jasmine and olive leaves around the initials |
| `parallax-back` | depth (section prompt S5): a misty line of dark shrubs and garden trees behind the hero's bottom band, dimmed; trails the scroll (`depth` -0.1). Phones only |
| `parallax-front` | depth (section prompt S6): peonies and amaranthus hanging at the sides, ahead of the scroll. Phones only |
| page background | `texture.webp`, a seamless velvet tile (in overrides.css) |

**Type.** Pinyon Script for names and section titles; Cormorant for labels
(spaced gold capitals) and italic lines; EB Garamond for body text.

**Layout.** `painted` cover (the art is the cover, no card), `framed` hero (the
couple's photo in the wreath, names below), editorial gallery.

**Colour.** Page `#43121d`, sampled from the paintings so art and page meet
without a seam. Ink cream `#f4e8da`, accent antique gold `#c9a55c`.

**Cultural notes.** Melati is the traditional wedding flower across Java and
Sumatra; anggrek bulan is the national "puspa pesona". No religious motifs, so
the pack suits every copy variant.

**Section art.** The section pieces were painted on cobalt, unlike the older cut-outs (keyed from the
wine ground), so the recipe despills them only (`despill_for`). The card corner came back as a crescent,
not an L, so the pack has no `card-corner` yet; the master is kept as `card-corner-unused.jpg`.
