# Sunda — Siger Mega Mendung

**Intent.** A light, regal Sundanese (West Java) wedding on ivory paper. Elements:
- the golden *siger* crown, shown resting on a carved stand as an heirloom;
- *mega mendung* cloud batik in deep indigo;
- long strings of *ronce melati*;
- slender *awi* (bamboo);
- on wide screens, misty rice-field terraces.

It is the cool, indigo-and-gold counterpart to Gebyok Sogan's warm sogan brown.

**Art.** Painted with Gemini from `PROMPT-SUNDA-ASSETS.md`. The masters are in
`design/packs/sunda/masters/`, and `scripts/build_pack_art.py sunda` builds the slot
files from them. The cut-outs are keyed from **magenta**, because the indigo clouds
rule out a blue key, and are edge-despilled.

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: mega mendung across the top with the siger at the centre, melati at the sides, bamboo and clouds at the foot; desktop has bamboo groves and rice terraces |
| `hero-top` / `hero-bottom` | the hero on phones: the cloud band with the siger and three melati loops; clouds, bamboo and scattered melati at the foot |
| `hero-bg` | the hero on wide screens (the desktop painting) |
| `photo-ring` | gold filigree oval wrapped in mega mendung, with a siger crest and a melati loop, on the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | mega mendung curling from the corner with gold filigree, bamboo and melati strings, used as a lintel over the closing |
| `particles` | melati flower and bud, bamboo leaf, rose petal, a small mega mendung cloud, a siger filigree flower |
| page background | `texture.webp`, seamless ivory paper (set in overrides.css) |

**Type.**
- Parisienne for the couple's names, event names and profile names.
- Forum's classical capitals for section titles and labels.
- Spectral for body text and the italic lines.

**Ornaments**, drawn in code:
- a small mega mendung cloud under each section title;
- a cloud-pair divider with a melati bead;
- an oval monogram frame with a siger crest and a cloud curl at its foot.

**Cultural notes for a reviewer from West Java.**
- The *siger* is the Sundanese bridal crown. It appears only resting on a stand or as a
  crest, never worn and never on a person, which treats it as an heirloom. Please check
  that this reads as respectful.
- *Mega mendung* comes from Cirebon. It is widely used as a West Java motif, but
  Cirebon has its own identity, distinct from Priangan Sundanese culture. Please check
  that pairing it with the siger reads right for a Sundanese wedding, or whether a
  Priangan motif would be better.
- *Ronce melati*, bamboo and rice terraces are general West Java imagery. None of the
  elements is a religious symbol, and there are no people and no text in the art.
- The pack's name describes the look ("Siger Mega Mendung"), not the ethnic group.
