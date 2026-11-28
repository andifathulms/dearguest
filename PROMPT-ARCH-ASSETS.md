# Prompts for the Arch pack art (Gemini image generation)

**Theme:** "Lengkung Pasir" (id `arch`, category *Modern & Minimalis*, the first pack there). A painted-minimal look:
- one tall **plaster arch** in warm sand, lit by late sun, with soft shadows falling across it;
- a single **olive branch** drawn in fine ink line with a light wash, climbing one side of the arch;
- a **ceramic bud vase** with one stem, and a touch of **terracotta**;
- lots of calm, empty plaster.

It is for couples who want clean and editorial but still painted, so the pack keeps real art. It also breaks from the
corner-bouquet cover that the four live florals share: the cover is architecture and light, not flowers. Pampas Kraft
is warm beige too, but it is dried flowers on kraft paper; this one is plaster, line and shadow, with almost no colour.

**Motion (suggested):** `exit: "bloom"` (the cover grows and fades, as if walking through the arch), `signature:
["breathe"]` (the arched portrait floats, barely; nothing else moves, so it stays quiet). If Prompt 8 is delivered,
the far colonnade trails the hero's scroll and the near olive sprigs move ahead of it.

**Photo frame:** the photo sits in an **arched** frame, not an oval (Prompt 4). The pack's CSS gives the photo the
same arch shape (`--dg-radius-photo`).

**How to use**
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) and Prompt 8 (depth layers) are optional.** If Gemini refuses the texture or paints something
   with objects in it, skip it; I generate the texture in code. Without Prompt 8 the hero still moves; with it, it
   gains real depth.
4. Then, **in the same chat**, paste the section pieces S1–S4 and the scene pieces C1–C4. If the style has drifted by
   then, open a new chat, attach your finished Prompt 1 image, paste Prompt 0 again and carry on from where you were.
5. If one is off, correct it in the same chat instead of starting a new chat.
6. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "build it".

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Cut-out pieces use flat cobalt blue (#2340C8).** The palette is sand, taupe, olive, terracotta and charcoal, with
  no blue.
- **Minimal means few things, not faint things.** Ask Gemini for clear ink lines and solid washes: very pale art
  disappears when it is cut out and set on the page. The line art must stay crisp, with no blue between thin stems.
- **The sprite sheet and the props sheet float on plain key colour.** The wording that kept the earlier sheets flat
  stays.
- **The scene paintings' calm areas come back smaller than asked**, so the percentages below ask a little wider than
  the page needs.
- **Shadows are painted into the full paintings only.** Cut-outs have no cast shadows: a shadow on the key colour
  turns into a grey smear.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Lengkung Pasir". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Modern, minimal painted illustration: soft gouache washes and fine ink line on warm plaster-toned paper, like a high-end editorial wedding invitation. Mediterranean-style plaster architecture, late-afternoon sunlight, soft long shadows, one or two botanical accents drawn in clear ink line. Very few elements and a great deal of calm, empty space. Quiet and elegant, never busy.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Paper and plaster: warm sand, base colour #F1E9DD, with a faint paper grain.
- Shadow: warm taupe (#C9B8A2), deepening to (#A8927A) in the darkest shadows.
- Line and leaves: olive green (#6E7454) with sage highlights (#A3A78A); ink line in warm charcoal (#2E2A25).
- Accent: terracotta (#B8664A), used sparingly: a vase, a ribbon, a candle.
- A few white flowers (#FBF8F2) where a prompt asks.
- No blue anywhere.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no animals, no birds, no religious symbols, no moon or stars.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: we stand in front of ONE tall, deep plaster arch in warm sand, seen straight on, filling the frame. The arch's thick plaster rim runs up both sides of the image, each side about 14% of the width, and its rounded top curves across the image between 6% and 18% of the height. Late sun falls from the upper left: a soft diagonal shadow lies across the right side of the arch's inner wall.
An olive branch drawn in fine ink line with a light olive wash climbs the LEFT side of the arch from the bottom-left corner to about 55% of the height, its leaves crossing slightly onto the rim. At the BOTTOM-RIGHT, a small terracotta bud vase with one white flower stands on a low plaster step. A low plaster step runs across the bottom 10% of the height.
INSIDE the arch — from 22% to 84% of the height, the middle 66% of the width — must be calm, flat warm plaster (#F1E9DD) with only faint grain and the soft edge of the sun's shadow; no leaves, no marks. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: a calm plaster wall in warm sand with ONE tall arch in the centre, its rim and inner wall in soft light, the arch's opening spanning the middle 44% of the width and rising from the bottom edge to 8% of the height. Late sun casts the long soft shadow of a second arch across the wall at the left. At the LEFT edge, about 20% of the width, an olive branch in fine ink line and light wash leans in; at the RIGHT edge, about 18% of the width, a tall terracotta vase with two dried stems stands on a low plaster bench.
The inside of the central arch is calm, flat warm plaster for text. Nothing inside it.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 22% only): the rounded top of a tall plaster arch curving across the full width, with soft sunlight on its rim and a slim olive sprig in fine ink line hanging from the curve at the upper left. Every leaf tip ends by 22% of the height.
BOTTOM BAND (bottom 18% only): the foot of the arch, a low plaster step across the full width, a small terracotta bud vase with one white flower at the right and a short olive sprig lying on the step at the left. Nothing rises above 82% of the height.
MIDDLE (from 22% to 82%): completely calm, flat warm plaster, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: arched frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an open ARCH-SHAPED frame: a fine line of warm gold and a slim band of sand plaster forming a tall arch (a rectangle with a fully rounded top), with one olive sprig in fine ink line and light wash winding up its lower left side and a single white flower at the bottom right. The frame's outer edge is about 80% of the image width and 92% of the height; its opening is about 64% of the width and 80% of the height, centred, with straight sides, a flat bottom and a semicircular top. Crisp lines, with no background colour between the thin stems.
The inside of the arch and everything outside the frame must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE light corner ornament anchored in the TOP-LEFT corner: a single olive branch in fine ink line with a light olive wash, coming in from the top-left corner and trailing diagonally toward the centre, with a few leaves falling away from its tip. It fills about the top-left 50% of the square. Crisp lines.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a single olive leaf, 2) a single sage-green olive leaf, 3) a small white petal, 4) a short olive twig with two leaves, 5) a small terracotta-tinted dried petal, 6) a single small white flower.
Each element about 60% of its grid cell, solid colour with soft shading and a clear ink outline (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 across the WHOLE square, top to bottom and edge to edge. The elements float in empty space: do NOT paint a floor, a table, ground, mist, haze, a shadow or a reflection anywhere, including the bottom third of the square, which is plain cobalt.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of warm sand plaster paper (#F1E9DD) with a faint natural grain, evenly lit from edge to edge, no pattern, no objects, no cracks, no stains, no vignette, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: a soft, pale colonnade of low plaster arches in a row, with two slim cypress trees behind them, washed out and lighter than everything else in the set, filling the BOTTOM 26% of the image. They run off the bottom edge: there is NO blue key below them, and the image's bottom edge cuts through them. Their top edge is a clear outline of arch tops and treetops against the background, not mist fading into it.
Everything above, from the top edge down to 74% of the height, must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: two large olive branches very close to the viewer and slightly soft, drawn in ink line with an olive wash, one coming in from the LEFT edge near the top and one from the RIGHT edge lower down, cropped by the sides, each reaching no more than 18% of the width into the picture, both between 8% and 60% of the height. The CENTRE of the image is empty. Nothing else anywhere.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

---

## Section pieces (S1–S4)

| Piece | File | Where it goes |
|---|---|---|
| S1 side spray | `section-edge` | grows in from the side edges of the sections (left, then mirrored), behind the cards, with its own scroll speed |
| S2 garland | `section-garland` | the painted divider between sections |
| S3 wreath | `monogram-wreath` | around the couple's initials at the closing and between the two profiles |
| S4 card corner | `card-corner` | on the corners of the event cards, the gift cards and the RSVP form |

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style. Portrait 9:16.
Paint ONE tall olive branch coming in from the LEFT edge of the image, cut by it, drawn in fine ink line with a light olive wash: a long, gently curving stem with sparse leaves and two small white flowers. The art stays in the LEFT 40% of the width and between 8% and 92% of the height, fullest around the middle, with its tip reaching to the right and thinning out. Keep it airy: a few leaves, not a bush. Crisp lines.
Everything else — the right 60% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal olive sprig lying across the CENTRE of the image, drawn in fine ink line with a light olive wash, with one small white flower and a short terracotta ribbon tied at its centre. It runs from about 12% to 88% of the width, tapering to single leaves at both ends, roughly symmetrical, and stays between 42% and 58% of the height. Keep it sparse. Crisp lines.
The background above, below and around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round, open wreath, centred: a fine warm-gold ring with two olive sprigs in ink line and light wash curving along its lower left and lower right, meeting at the bottom at one small white flower, and the top of the ring left bare. Its outer edge is about 88% of the image width. The opening in the middle is a clean circle about 62% of the width, completely empty — two initials will be set there in type. Nothing reaching into the opening. Crisp lines.
The inside of the wreath and everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: two fine warm-gold lines running along the top edge and down the left edge like an L, each arm reaching about 40% of the side, with one tiny olive sprig in ink line resting in the corner. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it very light.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Scene pieces (C1–C4)

| Piece | File | Where it goes |
|---|---|---|
| C1 scene | `scene-interlude` | behind the countdown: a sunlit arcade, with the numbers on the calm wall |
| C2a bride's attire | `attire-bride` | the bride's veil and hair comb on a plinth; stands in for her portrait when the couple shows no photos |
| C2b groom's attire | `attire-groom` | the groom's bow tie, boutonnière and pocket square on a plinth, used the same way |
| C3 props | `prop-1` … `prop-4` | one object beside the heading of the events, story, gift and RSVP sections, moving with the scroll |
| C4 evening closing | `closing-scene` | the cover's arch again at dusk with candles lit, behind the closing |

## Prompt C1: the scene

File: **`scene-interlude`** · Aspect ratio **3:4** (portrait) · a full painting, no cobalt

```
Image C1 of the set, same style. Portrait 3:4. This is a full painting on the warm sand plaster background #F1E9DD. No cobalt blue anywhere.
A quiet plaster arcade seen straight on, in late-afternoon sun.
TOP 18% of the height: the rounded tops of three arches in a row, in soft light, with the shadow of their rims falling across the wall.
LEFT and RIGHT edges, each no more than 12% of the width: a thick plaster pillar on each side, from top to bottom, cut by the edge of the image.
BOTTOM 22% of the height: a plaster floor in soft perspective with the long arched shadows of the arcade lying across it, a terracotta pot with a small olive tree at the right, and a single olive sprig fallen on the floor at the left.
CENTRE, from 20% to 74% of the height and across the middle 76% of the width: completely calm, flat warm plaster #F1E9DD with only faint grain — nothing there at all, no shadow edges. Numbers will be placed there by the website.
The top 4% and the bottom 5% of the image are plain warm plaster #F1E9DD too, and the art fades softly into them, so the picture can sit on a page of the same colour with no visible edge.
```

## Prompt C2: the attire, two images

Files: **`attire-bride`** and **`attire-groom`** · Aspect ratio **1:1** (square), one image each · cut-outs on cobalt

```
Image C2a of the set, same style. Square 1:1.
Paint ONE still-life, centred: a bride's soft white tulle veil gathered into a pearl-and-gold hair comb, draped over the top of a low, rounded plaster plinth and falling in loose folds down its side, with a single white flower and an olive sprig lying at the plinth's foot. There is NO head, NO face, NO hair, NO mannequin and NO person: only the veil, the comb, the flower and the plinth. The whole still-life fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges; the tulle is soft but opaque enough to read.
Everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze, no cast shadow under the plinth.
```

```
Image C2b of the set, same style. Square 1:1. Same size, same angle and same plinth as the previous image, so the two make a pair.
Paint ONE still-life, centred: a groom's charcoal silk bow tie and a folded white pocket square resting on the top of the same low, rounded plaster plinth, with a small boutonnière of olive leaves and one white flower tied with a terracotta ribbon lying beside them. There is NO head, NO face, NO mannequin, NO jacket on a body and NO person: only the bow tie, the pocket square, the boutonnière and the plinth. The whole still-life fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges.
Everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze, no cast shadow under the plinth.
```

## Prompt C3: the props sheet

File: **`props-sheet`** (cut into `prop-1` … `prop-4`: top-left → events, top-right → story, bottom-left → gift,
bottom-right → RSVP) · Aspect ratio **1:1** (square) · cut-outs on cobalt

```
Image C3 of the set, same style. Square 1:1.
Paint FOUR separate objects, one in each quarter of the image, arranged as a 2 × 2 grid. Each object sits in the middle of its own quarter and fills about 70% of it. There is a wide band of empty cobalt blue between the objects: none of them touches or overlaps another, and none touches the edge of the image.
TOP-LEFT: a slim terracotta bud vase holding one olive stem and one white flower.
TOP-RIGHT: two plain gold wedding rings resting in a small open box covered in sand-coloured linen.
BOTTOM-LEFT: a folded envelope in warm sand paper, closed with a plain terracotta wax seal that has NO letters or symbols on it, with a short olive sprig tucked under its flap.
BOTTOM-RIGHT: a short white pillar candle, unlit, on a small round plaster dish, with an olive leaf at its foot.
The background everywhere must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. This includes the lower third of the image: the two bottom objects float on plain cobalt blue exactly like the two top ones, with no ground, no floor, no table, no haze and no cast shadows beneath them.
Check the lower third once more before finishing: it must be the same flat cobalt blue #2340C8 as the top.
```

## Prompt C4: the evening closing

File: **`closing-scene`** · Aspect ratio **9:16** (portrait) · a full painting, no cobalt, no sand background

```
Image C4 of the set, same style and brushwork, but a DUSK version. Portrait 9:16. No cobalt blue anywhere, and no light sand background in this one image.
Paint the SAME arch as image 1, with the same composition, after sunset. The background is a deep warm dusk, base colour #2B2420, with the same faint paper grain. The plaster arch is lit softly from below by a row of small candles on the low plaster step, their flames small and steady; their glow warms the inside of the arch's rim and the olive branch on the left, and the top corners fall into deeper shadow. The terracotta bud vase stands at the bottom right in the candlelight. No moon, no stars.
The art stays in the outer rim of the arch and the BOTTOM 18% of the height, with the rim no wider than 13% of the width at each side and its top curve above 16% of the height.
INSIDE the arch, from 22% to 80% of the height and across the middle 68% of the width: completely calm, plain deep dusk #2B2420 — nothing there at all. The couple's initials and a closing message will be placed there by the website in light ink.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere (look at the wax seal); no people, no head or mannequin under the veil; no moon or stars.
- [ ] Prompts 1, 2, 3: the empty zones really are empty, including no shadow edge crossing the text area.
- [ ] Prompt 4: an arch with a semicircular top and straight sides, not an oval.
- [ ] Prompts 4, 5, 6, 8, S1–S4, C2 and C3: the background is one flat, even **cobalt blue** right to every edge, with no floor, haze, blurred patch or cast shadow, including the lower third of the sprite and props sheets.
- [ ] The ink lines are clear and the washes solid enough to read on a sand page.
- [ ] Prompt 8a: the colonnade touches the bottom edge. Prompt 8b: the centre is empty.
- [ ] C1: no cobalt; the centre is plain sand plaster; the top and bottom fade to plain sand. C4: no cobalt and no sand; the inside of the arch is plain deep dusk.
- [ ] C2: the two images match in size and angle. C3: four objects, well apart.
- [ ] All look like one set: same plaster, same olive line, same terracotta accent.

**For a reviewer:** this theme has no regional or religious elements. Please check:
- whether the arch reads as modern and elegant rather than as a mosque or church doorway, for couples of every faith;
- whether the bow tie and pocket square suit Indonesian grooms, or whether a black peci should be offered as a second groom piece;
- whether the dusk closing feels warm rather than sombre.
