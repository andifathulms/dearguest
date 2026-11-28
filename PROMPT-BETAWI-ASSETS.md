# Prompts for the Betawi pack art (Gemini image generation)

**Theme:** "Kembang Kelapa" (id `betawi`, category *Pesona Nusantara*). A festive Betawi wedding on warm cream paper:
- the **rumah kebaya** front: a carved **gigi balang** valance (a row of pointed wooden teeth) along the eaves,
  louvred **jalusi** doors and a turned-baluster **langkan** railing, painted jade green and cream;
- tall **kembang kelapa**, the bright paper-and-foil flower trees that line a Betawi procession, in red, cerise,
  marigold and gold;
- **melati** and red **mawar**, and a narrow **tumpal** (pucuk rebung triangles) border from batik Betawi.

It is the lightest, most cheerful look in *Pesona Nusantara*: Limas Emas and Gonjong Songket are red and gold on
dark grounds, Lamming Zamrud is deep green. This one is cream with jade green and festive colour. Ondel-ondel are
left out on purpose: they are figures, and the set has no people or figures.

**Motion (suggested):** `exit: "gate"` (the cover is symmetrical and splits down the middle, like the *palang pintu*
that bars the door until the groom's party is let in; the two halves slide apart), `signature: ["sway", "shimmer"]`
(the kembang kelapa's foil streamers move in a breeze, light runs across the gold). If Prompt 8 is delivered, the
far kampung roofline trails the hero's scroll and the near kembang kelapa move ahead of it.

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
- **Cut-out pieces use flat cobalt blue (#2340C8).** The palette is cream, jade green, red, cerise, marigold and
  gold, with no blue. Kembang kelapa are often painted with blue streamers; this set leaves blue out.
- **The sprite sheet and the props sheet float on plain key colour.** The wording that kept Palembang's and the scene
  pilot's sheets flat stays.
- **Depth layers:** the far layer touches the bottom edge, the near layer is cropped at the side edges.
- **The scene paintings' calm areas come back smaller than asked**, so the percentages below ask a little wider than
  the page needs.
- **No flags or pennants as props:** a lone striped flag reads as a national one (the marawa lesson).
- **Foil and streamer edges must be crisp**, with no blue between the streamers.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Kembang Kelapa". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted illustration, gouache with fine ink line and touches of gold leaf on warm cream paper, festive and joyful like a printed invitation for a Betawi wedding in Jakarta. Crisp carved woodwork, bright clean colour, soft shadows, generous empty space. Cheerful, not cluttered.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Paper: warm cream, base colour #FBF3E4, with a faint paper grain.
- Woodwork: jade green (#2E7D5B) with cream (#F4E9D2) trim, the colours of a painted rumah kebaya.
- Festive colours: Betawi red (#B3262E), cerise pink (#D9467A), marigold yellow (#E8A93A).
- Gold: warm gold (#C59A45) with lighter highlights (#E5C67E).
- Flowers: white melati, a few deep red mawar, green leaves.
- No blue anywhere.

BETAWI ELEMENTS (use where each prompt says)
- Gigi balang: the carved wooden valance along the eaves of a Betawi house, a row of pointed teeth like a fringe of small arrowheads, in jade green with cream.
- Rumah kebaya: the Betawi house with a wide open front veranda, tall louvred (jalusi) double doors, and a low langkan railing of turned wooden balusters.
- Kembang kelapa: a tall festive decoration, a bamboo pole bristling with dozens of thin sticks, each topped with a bright paper or foil flower and fine streamers, in red, cerise, marigold and gold; it stands in a small round base.
- Tumpal: a narrow border of tall triangles (pucuk rebung) from batik Betawi, in red, cream and gold.
- Melati and mawar: white jasmine and red roses.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no ondel-ondel or other figures, no animals, no landmarks or monuments, no flags or pennants, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted. The composition must be SYMMETRICAL left to right: the image will be split down the centre and the two halves slide apart.
TOP (the top 20% of the height): the eave of a rumah kebaya seen from the front, a jade-green beam with a long gigi balang valance hanging from it across the full width, with a small brass hanging lamp at each side and a loop of melati at the centre.
LEFT and RIGHT edges, each no more than 16% of the width: one tall kembang kelapa standing on each side, from the bottom up to about 30% of the height, its paper and foil flowers in red, cerise, marigold and gold, cut by the edge of the image.
BOTTOM (the bottom 16% of the height): a low langkan railing of turned jade-green balusters across the full width, with a narrow tumpal border along its top rail and a scattering of melati and rose petals on the floor in front.
The CENTRE — from 24% to 82% of the height, the middle 66% of the width — must be calm, empty cream paper (#FBF3E4) with only faint grain. No streamers, petals or splashes in that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted. Symmetrical left to right.
Along the LEFT and RIGHT edges, each about 22% of the width: a tall louvred jalusi door panel in jade green and cream, half open, with a tall kembang kelapa standing in front of it and a few melati at its foot.
Along the very top edge, a slim gigi balang valance runs across the full width, no deeper than 9% of the height.
The CENTRE 52% of the width, from 12% of the height to the bottom, is calm empty cream paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 24% only): the jade-green eave beam with a gigi balang valance across the full width, and below it, at the centre, a short swag of melati with a red rose, between two small brass hanging lamps. Every tip ends by 24% of the height.
BOTTOM BAND (bottom 20% only): a low langkan railing of turned balusters across the full width with a tumpal border on its rail, and a small kembang kelapa at each bottom corner, slightly taller at the corners. Nothing rises above 80% of the height.
MIDDLE (from 24% to 80%): completely empty cream paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an open OVAL frame: a fine gold ring wound with melati and small red, cerise and marigold paper flowers like the ones on a kembang kelapa, fuller at the bottom (a cluster of flowers with a few short foil streamers and a red rose) and at the top (a small loop of melati), lighter at the sides. A narrow tumpal band follows the bottom curve of the ring. The oval's outer edge is about 88% of the image width; its opening is about 68% of the width and 70% of the height, centred. Crisp edges, with no background colour inside the flowers or between the streamers.
The inside of the oval and everything outside the frame must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner ornament anchored in the TOP-LEFT corner: a short length of gigi balang valance running along the top edge, with a spray of red, cerise and marigold paper flowers, a few foil streamers and two strings of melati hanging from it and trailing diagonally toward the centre. It fills about the top-left 55% of the square. Crisp edges.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a single red paper flower from a kembang kelapa, 2) a single cerise paper flower, 3) a single marigold paper flower, 4) a white melati bud, 5) a red rose petal, 6) a short curled strip of gold foil streamer.
Each element about 60% of its grid cell, solid colour with soft shading (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 across the WHOLE square, top to bottom and edge to edge. The elements float in empty space: do NOT paint a floor, a table, ground, mist, haze, a shadow or a reflection anywhere, including the bottom third of the square, which is plain cobalt.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of warm cream paper (#FBF3E4) with a faint natural grain, evenly lit from edge to edge, no pattern, no objects, no stains, no vignette, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: a soft, pale row of Betawi kampung roofs with small gigi balang along their eaves, a few coconut palms and a belimbing tree between them, washed out and lighter than everything else in the set, filling the BOTTOM 28% of the image. They run off the bottom edge: there is NO blue key below them, and the image's bottom edge cuts through them. Their top edge is a clear outline of rooftops and palm crowns against the background, not mist fading into it.
Everything above, from the top edge down to 72% of the height, must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: two large kembang kelapa very close to the viewer and slightly soft, one at the LEFT edge and one at the RIGHT edge, cropped by the sides, each reaching no more than 18% of the width into the picture, their flowers and streamers between 10% and 60% of the height. The CENTRE of the image is empty. Nothing else anywhere.
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
Paint ONE tall kembang kelapa leaning in from the LEFT edge of the image, cut by it: its bamboo pole bristling with red, cerise, marigold and gold paper flowers and fine foil streamers, with a string of melati wound around the pole. The art stays in the LEFT 42% of the width and between 8% and 92% of the height, fullest around the middle, with fine streamer tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 58% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze, no base under the pole.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: a strand of melati with small red, cerise and marigold paper flowers along it, a red rose at the centre, and a few short gold foil streamers hanging below the middle. It runs from about 6% to 94% of the width, fullest in the middle and tapering to single melati buds at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: a fine gold ring wound with melati and small red, cerise and marigold paper flowers, two red roses and a few short foil streamers at the bottom, and a narrow tumpal band along the lower curve. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a short run of tiny gigi balang teeth along the top edge and down the left edge like an L, with one red paper flower and two melati buds in the corner itself. Each arm reaches about 40% of the side. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Scene pieces (C1–C4)

| Piece | File | Where it goes |
|---|---|---|
| C1 scene | `scene-interlude` | behind the countdown: a rumah kebaya in its garden, with the numbers in the calm sky above it |
| C2a bride's attire | `attire-bride` | the bride's headdress on a stand; stands in for her portrait when the couple shows no photos |
| C2b groom's attire | `attire-groom` | the groom's headwear on a stand, used the same way |
| C3 props | `prop-1` … `prop-4` | one object beside the heading of the events, story, gift and RSVP sections, moving with the scroll |
| C4 evening closing | `closing-scene` | the cover's veranda again at night with the lamps lit, behind the closing |

## Prompt C1: the scene

File: **`scene-interlude`** · Aspect ratio **3:4** (portrait) · a full painting, no cobalt

```
Image C1 of the set, same style. Portrait 3:4. This is a full painting on the cream paper background #FBF3E4, painted lightly like a watercolour study. No cobalt blue anywhere.
BOTTOM 34% of the height: a rumah kebaya seen from the front in its yard: the wide open veranda with its langkan railing, tall louvred doors, the gigi balang valance along the eaves, jade-green and cream woodwork, a belimbing tree and a coconut palm beside it, and two kembang kelapa standing at the foot of the steps.
TOP 14% of the height: one slim gigi balang valance running across the full width, with a small loop of melati at the centre.
CENTRE, from 18% to 62% of the height and across the middle 84% of the width: completely calm, plain cream paper #FBF3E4 — nothing there at all, no clouds, no birds. Numbers will be placed there by the website.
The top 4% and the bottom 5% of the image are plain cream paper #FBF3E4 too, and the art fades softly into them, so the picture can sit on a page of the same colour with no visible edge. The left and right edges also fade to plain cream in their outer 5%.
```

## Prompt C2: the attire, two images

Files: **`attire-bride`** and **`attire-groom`** · Aspect ratio **1:1** (square), one image each · cut-outs on cobalt

```
Image C2a of the set, same style. Square 1:1.
Paint ONE object, centred: the headdress of a Betawi bride, shown on its own as an heirloom. A gold crown with a small phoenix (burung hong) at its crest, many kembang goyang (gold flower hairpins on fine springs) fanning out around it, and a siangko, a fringe of fine gold-and-pearl bead strings, hanging from its front edge. It rests on a low carved stand in jade green and gold, wrapped in red cloth with a tumpal border. There is NO head, NO face, NO hair, NO mannequin and NO person: only the headdress and its stand. The whole object fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges.
Everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze, no cast shadow under the stand.
```

```
Image C2b of the set, same style. Square 1:1. Same size, same angle and same kind of stand as the previous image, so the two make a pair.
Paint ONE object, centred: the headwear of a Betawi groom, a rounded wrapped headpiece (alpie) in white and gold cloth with a gold ornament at its front and a short gold tassel, resting on the same low carved stand in jade green and gold, with a folded red-and-gold sash laid at its foot. There is NO head, NO face, NO mannequin and NO person: only the headwear, the sash and the stand. The whole object fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges.
Everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze, no cast shadow under the stand.
```

## Prompt C3: the props sheet

File: **`props-sheet`** (cut into `prop-1` … `prop-4`: top-left → events, top-right → story, bottom-left → gift,
bottom-right → RSVP) · Aspect ratio **1:1** (square) · cut-outs on cobalt

```
Image C3 of the set, same style. Square 1:1.
Paint FOUR separate objects, one in each quarter of the image, arranged as a 2 × 2 grid. Each object sits in the middle of its own quarter and fills about 70% of it. There is a wide band of empty cobalt blue between the objects: none of them touches or overlaps another, and none touches the edge of the image.
TOP-LEFT: a small kembang kelapa standing in its round base, bristling with red, cerise, marigold and gold paper flowers and streamers.
TOP-RIGHT: a tehyan, the slim two-stringed fiddle of gambang kromong music, with its small round wooden body and its bow laid across it.
BOTTOM-LEFT: a pair of roti buaya, the two crocodile-shaped wedding breads, golden-brown and glossy, lying side by side on a tray covered with red cloth and a tumpal border.
BOTTOM-RIGHT: a sirih dare, green sirih leaves folded and arranged into a tall cone, decorated with small red and white flowers, on a small brass dish.
The background everywhere must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. This includes the lower third of the image: the two bottom objects float on plain cobalt blue exactly like the two top ones, with no ground, no floor, no table, no haze and no cast shadows beneath them.
Check the lower third once more before finishing: it must be the same flat cobalt blue #2340C8 as the top.
```

## Prompt C4: the evening closing

File: **`closing-scene`** · Aspect ratio **9:16** (portrait) · a full painting, no cobalt, no cream background

```
Image C4 of the set, same style and brushwork, but a NIGHT version. Portrait 9:16. No cobalt blue anywhere, and no cream background in this one image.
Paint the SAME scene as image 1, with the same symmetrical composition, at night. The background is a deep warm night, base colour #2A1618, with the same faint paper grain. The two brass hanging lamps under the gigi balang valance are lit with small steady flames, and their warm light falls on the jade-green woodwork and the melati. The kembang kelapa at both sides catch the light: their gold foil glints and the paper flowers glow red, cerise and marigold. At the foot, the langkan railing and the scattered petals sit in a pool of lamplight, and the corners fall into deeper shadow.
The art stays in the TOP 22% and the BOTTOM 20% of the height, with the kembang kelapa no wider than 14% of the width at each side.
CENTRE, from 26% to 76% of the height and across the middle 70% of the width: completely calm, plain deep night #2A1618 — nothing there at all. The couple's initials and a closing message will be placed there by the website in light ink.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people, no ondel-ondel, no head or hair under the headdress or headwear; no flags, no Monas or other landmarks.
- [ ] Prompts 1, 2, 3: the empty zones really are empty. Prompt 1 is symmetrical left to right.
- [ ] Prompts 4, 5, 6, 8, S1–S4, C2 and C3: the background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch, including the lower third of the sprite and props sheets.
- [ ] No blue in the kembang kelapa streamers.
- [ ] Prompt 8a: the roofs touch the bottom edge. Prompt 8b: the centre is empty.
- [ ] C1: no cobalt; the centre is plain cream; the edges fade to plain cream. C4: no cobalt and no cream; the centre is plain deep night.
- [ ] C2: the two images match in size and angle. C3: four objects, well apart.
- [ ] All look like one set: same jade green, same festive colours, same cream paper.

**For a reviewer from the Betawi community.** These were chosen by someone outside the culture, so please check each one before it ships:
- Do the gigi balang, the rumah kebaya veranda and the kembang kelapa read as Betawi at first glance, without ondel-ondel? Should the kembang kelapa's colours follow a set convention?
- The bride's headdress: are the burung hong crown, the kembang goyang and the siangko right for a Betawi bride (*dandanan care none*), and is it respectful to show them on a stand without a person?
- The groom's headwear: is the alpie right, and does it suit couples of every background? The *care haji* attire carries a link to the hajj: would a plain stand-alone headpiece feel out of place, and would a black peci with gold trim be the safer choice?
- Do the roti buaya, the sirih dare, the tehyan and the kembang kelapa belong at a Betawi wedding, and may they float beside invitation text? Is the roti buaya pair right as the gift-section object?
- Does a gate that opens (after the *palang pintu*) suit the cover, or is that ceremony too specific to show?
- Does a night version of the veranda feel right for the closing?
