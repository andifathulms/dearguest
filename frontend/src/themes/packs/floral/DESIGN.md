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
