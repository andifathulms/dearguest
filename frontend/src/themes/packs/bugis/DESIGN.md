# Bugis — Lamming Sabbe

**Intent.** A rich Bugis-Makassar (South Sulawesi) wedding on emerald silk: the
gold-carved *lamming* with layered *timpa laja* gables and *bunga parenreng*
vines, *walasuji* lattice, red *lipa' sabbe* silk, red-and-gold *bosara*, and the
*mappacci* night's *daun pacar*, *pesse pelleng* candles and *beras kuning*.

**Art** (painted with Gemini from `PROMPT-BUGIS-ASSETS.md`; masters in
`design/packs/bugis/masters/`, slot files built by `scripts/build_pack_art.py bugis`;
cut-outs keyed from cobalt with blue despill; the corner was cropped above a
darker band in its background; the silk texture is generated, because Gemini
wouldn't paint it):

| Slot | Use |
|---|---|
| `cover-bg` (+ desktop) | the cover: gabled lamming crown, walasuji borders, a row of bosara |
| `hero-top` / `hero-bottom` | the hero on phones: carved lintel with sabbe swags; mappacci tray, bosara and candles |
| `hero-bg` | the hero on wide screens (the desktop lamming) |
| `photo-ring` | carved gold oval with a sabbe band, around the hero portrait and both profiles |
| `corner-tl` (mirrored to `corner-br`) | carved bracket with walasuji and a sabbe swag, framing the closing |
| `particles` | melati, cempaka petal, daun pacar, daun sirih, beras kuning, gold sulapa eppa sequin |
| page background | `texture.webp`, generated seamless emerald silk (in overrides.css) |

**Type.** Italianno for the couple's names and section titles; Playfair Display
for display lines; Lora for body text, spaced labels and italic lines.

**Ornaments** drawn in code: a sulapa eppa diamond under titles, a walasuji
lattice divider, and a sulapa eppa monogram frame.

**Cultural notes for a reviewer.** Lamming, bosara and the mappacci items are
wedding custom, not religious symbols. Sulapa eppa (the four-sided square)
expresses the four elements in Bugis-Makassar cosmology; it's used here only as
ornament. No Lontara script, no baju bodo (whose colours signal age and status).
