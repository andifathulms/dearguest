# Jawa — Gebyok Sogan

**Intent.** A light, regal Javanese (Solo/Yogyakarta keraton) invitation. A
carved teak *gebyok* doorway frames the couple; *ronce melati* hang from it;
*kembang setaman* (melati, mawar, kantil, kenanga) is scattered like the
flowers at a *siraman* or *panggih*. Sogan brown and antique gold on ivory
paper. The light counterpart of Floral's dark wine.

**Art** (painted with Gemini from `PROMPT-JAVANESE-ASSETS.md`; masters in
`design/packs/javanese/masters/`, slot files built by `scripts/build_pack_art.py javanese`):

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: the gebyok doorway, names inside it |
| `hero-top` / `hero-bottom` | the hero on phones: carved lintel with melati garlands; kembar mayang and petals at the foot |
| `hero-bg` | the hero on wide screens (the desktop gebyok) |
| `photo-ring` | oval frame of ronce melati with mawar and kantil, around the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | carved bracket with melati strings, framing the closing words |
| `particles` | kembang setaman: melati, melati bud, kantil petal, mawar petal, kenanga, janur curl |
| page background | `texture.webp`, seamless ivory paper (in overrides.css) |

**Type.** Cinzel (Roman capitals) for titles and labels, like engraved
keraton lettering; Alex Brush for the couple's names; Crimson Pro for body
text and italic lines (Cinzel has no italic).

**Ornaments** drawn in code: kawung under titles and as the divider; a wajik
(diamond) monogram frame with kawung at its points.

**Cultural notes for a reviewer.**
- Kembang setaman, ronce melati, kembar mayang and janur all belong to
  Javanese wedding custom; none is a religious symbol.
- Kawung is a classical batik motif. Historically some motifs (e.g. parang
  rusak) were reserved for the keraton; kawung and the generic ornaments used
  here are in common wedding use today.
- No wayang figures, no aksara Jawa (all text is Latin, rendered by the app).
