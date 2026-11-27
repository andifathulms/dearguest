# Scene art prompts: Gebyok Sogan (`javanese`)

**What these are for.** Five new images that give the page a second painting and things that move. After
the hero, the page is ivory paper with text and cards until the closing; these fill that stretch.

| Piece | File | Where it goes |
|---|---|---|
| C1 scene | `scene-interlude` | behind the countdown: a view into a pendopo with hanging lamps, with the numbers in its calm centre |
| C2a bride's attire | `attire-bride` | the bride's hair ornaments and jasmine on a cushion. Stands in for the bride's portrait when the couple shows no photos |
| C2b groom's attire | `attire-groom` | the blangkon and keris on a cushion, used the same way for the groom |
| C3 props | `prop-1` … `prop-4` | four separate objects, one beside the heading of each of the events, story, gift and RSVP sections, moving with the scroll |
| C4 evening closing | `closing-scene` | the cover's gebyok again at night with the lamps lit, behind the closing |

**How to use**
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/javanese/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts C1–C4 one at a time, choosing the aspect ratio each one names. C2 is two images.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "scene art for Gebyok Sogan".

**Cut-outs (C2, C3) use flat teal #1E8C8C**, the same key colour as this theme's other cut-outs. Keep it flat
right to every edge: Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.
**C1 is a full painting on the theme's ivory paper. C4 is a full painting on a dark night background.**
Neither has any teal.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Gebyok Sogan". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted illustration, gouache and fine ink on textured paper, refined and regal like a printed invitation from a Solo or Yogyakarta keraton family. Soft painterly shading, crisp carved-wood detail, gentle shadows. Elegant, not busy.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: warm ivory parchment, base colour #F3E9D8, with very faint paper fibres.
- Wood: carved teak in warm sogan brown (#6B4426 to #3B2416), with antique gold (#B8913F) highlights on the carving.
- Flowers: white melati (jasmine) as the main flower, cream-yellow kantil (white champak), pale yellow-green kenanga, and a few deep red mawar (roses) as accents.
- Greenery: young janur (coconut leaf, pale yellow-green) and a little dark green foliage.
- Batik: sogan brown/cream parang or sidomukti patterns only as narrow borders or on fabric — never covering large areas.

JAVANESE ELEMENTS (use where each prompt says)
- Gebyok: a carved teak wedding doorway/screen with floral relief, an arched top and side pillars.
- Ronce melati: long strings/garlands of jasmine buds hanging in loops.
- Kembang setaman: a scattering of melati, mawar, kantil and kenanga petals.
- Janur and kembar mayang: woven young coconut-leaf decorations, used at the bottom corners.

ALWAYS
- No text, no letters, no numbers, no Javanese script (aksara), no logos, no signatures, no watermarks.
- No people, no wayang figures, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt C1: the scene

File: **`scene-interlude`** · Aspect ratio **3:4** (portrait) · a full painting, no teal

```
Image C1 of the set, same style as the attached painting. Portrait 3:4. This is a full painting on the ivory parchment background #F3E9D8. No teal anywhere.
A view looking straight into an open Javanese pendopo, painted lightly, like a watercolour study on the parchment.
TOP 22% of the height: the underside of the joglo roof with its carved teak beams in sogan brown and antique gold, and three brass hanging lamps with glass chimneys on chains, the middle one lowest, with strings of ronce melati looped between the beams.
LEFT and RIGHT edges, each no more than 14% of the width: one carved teak pillar on each side, from the roof down to the floor, cut by the edge of the image.
BOTTOM 26% of the height: the polished floor in soft perspective, a scattering of kembang setaman petals, and a pair of kembar mayang, one at each bottom corner.
CENTRE, from 26% to 68% of the height and across the middle 72% of the width: completely calm, plain ivory parchment #F3E9D8 — nothing there at all. Numbers will be placed there by the website.
The top 4% and the bottom 5% of the image are plain ivory parchment #F3E9D8 too, and the art fades softly into them, so the picture can sit on a page of the same colour with no visible edge.
```

## Prompt C2: the attire, two images

Files: **`attire-bride`** and **`attire-groom`** · Aspect ratio **1:1** (square), one image each · cut-outs on teal

```
Image C2a of the set, same style. Square 1:1.
Paint ONE still-life arrangement, centred: the hair ornaments of a Javanese bride, shown on their own as heirlooms. Five gold cunduk mentul (flower-shaped hairpins on fine stems) stand in a fan, with a gold comb in front of them, and long strings of ronce melati jasmine buds with a kantil flower at their ends draped across and hanging down at one side. They rest on a small cushion covered in sogan-brown batik with a narrow gold edge. There is NO head, NO face, NO hair, NO mannequin and NO person: only the ornaments, the jasmine and the cushion. The whole arrangement fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges.
Everything around it must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain teal too: no ground, no floor, no haze, no cast shadow under the cushion.
```

```
Image C2b of the set, same style. Square 1:1. Same size, same angle and same kind of cushion as the previous image, so the two make a pair.
Paint ONE still-life arrangement, centred: a blangkon, the Javanese groom's batik headcloth, in sogan-brown batik, resting on a small cushion covered in sogan-brown batik with a narrow gold edge. In front of it lies a keris in its carved wooden sheath, fully sheathed, with a short string of ronce melati wound around the hilt. There is NO head, NO face, NO mannequin and NO person: only the blangkon, the sheathed keris, the jasmine and the cushion. The whole arrangement fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges.
Everything around it must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain teal too: no ground, no floor, no haze, no cast shadow under the cushion.
```

## Prompt C3: the props sheet

File: **`props-sheet`** (cut into `prop-1` … `prop-4`) · Aspect ratio **1:1** (square) · cut-outs on teal

```
Image C3 of the set, same style. Square 1:1.
Paint FOUR separate objects, one in each quarter of the image, arranged as a 2 × 2 grid. Each object sits in the middle of its own quarter and fills about 70% of it. There is a wide band of empty teal between the objects: none of them touches or overlaps another, and none touches the edge of the image.
TOP-LEFT: a brass hanging lamp with a glass chimney, on a short length of chain, with a small loop of ronce melati.
TOP-RIGHT: a kembar mayang, the tall woven young-coconut-leaf wedding decoration, pale yellow-green, with a few melati.
BOTTOM-LEFT: a clay kendi (water jug) with a few melati, kantil and rose petals at its mouth and a strip of sogan batik tied at its neck.
BOTTOM-RIGHT: a small bronze gong hanging in a carved teak frame with antique-gold highlights.
The background everywhere must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. This includes the lower third of the image: the two bottom objects float on plain teal exactly like the two top ones, with no ground, no floor, no table, no haze and no cast shadows beneath them.
Check the lower third once more before finishing: it must be the same flat teal #1E8C8C as the top.
```

## Prompt C4: the evening closing

File: **`closing-scene`** · Aspect ratio **9:16** (portrait) · a full painting, no teal

```
Image C4 of the set, same style and brushwork, but a NIGHT version. Portrait 9:16. No teal anywhere, and no ivory background in this one image.
Paint the SAME carved gebyok doorway as the attached cover painting, with the same composition, at night. The background is a deep, warm sogan night, base colour #2A1A10, with the same faint paper fibres. Two brass hanging lamps glow at the top corners of the arch, and their warm light falls on the carved teak, picks out the antique gold of the relief and makes the white ronce melati strings look softly luminous. At the foot, the kembar mayang and the scattered kembang setaman petals sit in a pool of lamplight, and the corners fall into deeper shadow.
The art stays in the TOP 26% and the BOTTOM 24% of the height, with the pillars no wider than 12% of the width at each side.
CENTRE, from 28% to 72% of the height and across the middle 72% of the width: completely calm, plain deep sogan #2A1A10 — nothing there at all. The couple's initials and a closing message will be placed there by the website in light ink.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters, aksara or watermark anywhere; no people, no head or hair under the ornaments or the blangkon; no wayang.
- [ ] C1: no teal; the centre is plain ivory; the top and bottom edges fade to plain ivory.
- [ ] C4: no teal and no ivory; the centre is plain deep sogan brown.
- [ ] C2 and C3: one flat, even **teal** right to every edge, with no floor, haze or shadow, including the lower third of the props sheet.
- [ ] C2: the two images match in size and angle. C3: four objects, well apart. The keris is sheathed.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer from Solo or Yogyakarta.** These were chosen by someone outside the culture, so please check each one before it ships:
- Is it respectful to show the bride's cunduk mentul and the groom's blangkon and keris as objects on cushions, and are these the right pair? Would a kuluk suit better than a blangkon for the groom?
- Solo and Yogyakarta styles differ (the blangkon's shape, the number of cunduk mentul). Should the art follow one, or stay general?
- May a keris appear at all, even sheathed and wound with melati?
- Do the hanging lamp, kembar mayang, kendi and gong belong at a wedding, and may they be used as decoration that floats beside invitation text? Does the kendi read as siraman only?
- Does a night version of the gebyok feel right for the closing, or does a dark ending carry an unwanted meaning?
