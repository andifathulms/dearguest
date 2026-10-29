# Prompts for the Batak pack art (Gemini image generation)

**Theme:** "Gorga Ulos". A bold Batak Toba wedding (*ulaon unjuk*) on ivory:
- **gorga**: the carved and painted ornament of the *rumah bolon*, in the Batak three colours: red, black and white;
- the sweeping, horn-tipped **roofline of the rumah bolon**;
- **ulos** cloth (Ragi Hotang style: maroon, black and white bands with fine gold-white thread), folded and draped with its fringe;
- a woven pandan **tandok** and *hariara* (fig) leaves;
- on wide screens, **Lake Toba** and the hills of Samosir in the distance.

It is the graphic, high-contrast look in *Pesona Nusantara*. It keeps away from Gonjong Songket's black lacquer: here the ground is ivory and the red and black are the ornament.

**Motion (suggested):** `exit: "part"` (the roofline lifts away, the ulos runner sinks), `signature: ["sway", "breathe"]` (ulos fringe and leaves moving). If Prompt 8 is delivered, the lake and the near leaves trail the hero's scroll for depth.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) and Prompt 8 (depth layers) are optional.** If Gemini refuses the texture or paints something with objects in it, skip it; I generate the texture in code. Without Prompt 8 the hero still moves; with it, it gains real depth.
4. If one is off, correct it in the same chat instead of starting a new chat.
5. File names don't matter. Drop everything into the repo's `assets/` folder.

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Cut-out pieces use flat cobalt blue (#2340C8).** The ornament palette is red, black, white and maroon, with no blue. The lake appears only in the opaque desktop cover, which is never keyed.
- **Every cut-out background must be flat right to every edge.** Rustic's corner and sprite sheet came back with blurred patches and a haze band; Sunda's sheet had a mist band.
- **Fine fringe and thread must be crisp.** Rustic's pampas came back with cobalt mixed into the hair tips, which left a dark outline. Ask for "solid, crisp fringe threads, no colour from the background in them".

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital Batak Toba wedding invitation theme called "Gorga Ulos". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted gouache illustration on warm ivory paper, crisp and graphic like a carved-and-painted gorga panel, with soft painterly shading on the cloth and leaves. Bold, confident ornament; generous empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: warm ivory paper, base colour #F4EDE1, with faint fibres.
- Gorga: the Batak three colours — deep red (#A3201B), black (#1A1412) and chalk white (#F7F3EA) — in carved spirals and interlocking curls, with thin black outlines.
- Ulos: Ragi Hotang style — maroon (#6E1A1E), black and white bands with fine gold-white thread (#E6D6A8) and a long knotted fringe.
- Wood: dark weathered timber (#3A2A22) for the house beams.
- Accents: deep green hariara fig leaves (#3F5B3A), pale woven pandan (#CDB98A), a few white jasmine.
- No blue anywhere except the lake and sky in the desktop landscape.

BATAK ELEMENTS (use where each prompt says)
- Gorga: carved ornament of curling spirals and interlocking vine-like curls (ipon-ipon borders, simeol-eol curls). Do NOT paint faces, singa heads, lizards, breasts, or the eight-pointed Desa Naualu star — ornament only.
- Rumah bolon: the traditional house's tall, saddle-backed roof sweeping up to points at both ends, its gable and front beam covered in gorga. Shown as architecture only, from outside.
- Ulos: folded or draped cloth with its knotted fringe — never worn by a person.
- Tandok: a woven pandan rice basket with a red-black-white band.
- Landscape (desktop only): Lake Toba with the soft hills of Samosir in morning haze.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks.
- No people, no animals, no weapons, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: across the TOP 24%, the front gable of a rumah bolon seen straight on: the roof's dark eaves sweeping up to points at both top corners, and below them a wide carved beam of red, black and white gorga spirals running the full width. From the beam's ends, two folded ulos hang down the LEFT and RIGHT edges with their fringe, ending by 40% of the height and no more than 12% of the width in from each side. Across the BOTTOM 16%, an ulos runner laid flat along the bottom edge with a tandok and hariara leaves at the left corner and jasmine at the right.
The CENTRE — from 27% to 82% of the height, the middle 76% of the width — must be calm, empty ivory paper (#F4EDE1) with only faint fibres. Nothing reaches into that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: on the LEFT and RIGHT, each about 22% of the width, tall carved house posts and gorga panels of a rumah bolon with draped ulos and hariara leaves; across the top, the dark curved eave sweeping between them. Along the very bottom edge, a faint view of Lake Toba and the hills of Samosir in pale morning haze, fading into the paper. The CENTRE 54% of the width, top to bottom, is calm empty ivory paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 26% only): a carved gorga beam in red, black and white across the full width under a strip of dark eave, with three short ulos swags hanging below it, their fringes ending by 26% of the height.
BOTTOM BAND (bottom 20% only): an ulos runner along the bottom edge with its fringe, a small tandok and hariara leaves at each corner, a few jasmine. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty ivory paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an elegant OVAL frame carved like gorga: a band of red, black and white interlocking spirals with thin black outlines, crowned at the top by a small upswept rumah bolon roof point, with a short folded ulos and its fringe hanging at the bottom. The oval's outer edge is about 86% of the image width; its opening is about 66% of the width and 70% of the height, centred. Clean, crisp edges; the fringe threads solid and crisp, with no background colour in them.
The inside of the oval and everything outside the frame must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner ornament anchored in the TOP-LEFT corner: a carved gorga bracket of red, black and white spirals running along the top and left edges, with a folded ulos hanging from it, its fringe swinging free, and two hariara leaves. It fills about the top-left 55% of the square and thins out toward the centre. Clean, crisp edges; solid fringe threads.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a small knotted ulos fringe tassel in maroon and white, 2) a small round gorga spiral rosette in red, black and white, 3) a hariara fig leaf, 4) a white jasmine flower, 5) a short strip of woven pandan, 6) a single red hibiscus petal.
Each element about 60% of its grid cell, solid colour with soft shading (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 across the WHOLE square, top to bottom and edge to edge — no haze, no mist, no landscape, no gradient, no shadows.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of warm ivory handmade paper (#F4EDE1) with soft natural fibres, evenly lit, no pattern, no objects, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: a soft, pale, low band of Lake Toba and the hills of Samosir across the bottom 30% only, washed out and lighter than everything else in the set, as if seen through morning haze. Nothing above 70% of the height.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: two or three large hariara fig leaves and the end of an ulos fringe, very close to the viewer and slightly soft, entering from the LEFT and RIGHT edges and cropped by them, each reaching no more than 20% of the width into the picture. The CENTRE 60% of the width, top to bottom, is empty.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] No faces, singa heads, lizards or eight-pointed stars in the gorga.
- [ ] Prompts 1, 2, 3: the empty zones really are empty.
- [ ] Prompts 4, 5, 6 (and 8): the background is one flat, even **cobalt blue** right to every edge, with no blurred patch or haze band, and the fringe threads are crisp.
- [ ] All look like one set: same red, black and white gorga, same ulos, same ivory.

**For a reviewer from Tapanuli / Toba:**
- Ulos is given with meaning (*mangulosi*). It is shown here folded or draped as an honoured cloth, never worn by a figure. Please check this reads as respectful.
- The gorga is kept to ornamental spirals and curls. Faces, *singa* heads, lizards (*boraspati*), breasts (*adop-adop*) and *Desa Naualu* were left out because of their protective and cosmological meanings. Is that the right call, or would families expect some of them?
- This is a Toba look. Karo, Simalungun, Pakpak, Angkola and Mandailing weddings each have their own houses, cloth and colours, and may want their own themes later.
- Many Batak Toba families are Christian; the theme carries no religious symbol, and the invitation's copy variants handle the wording.
