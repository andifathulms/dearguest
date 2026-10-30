# Prompts for the Tropis pack art (Gemini image generation)

**Theme:** "Anggrek Bulan". A lush tropical garden on warm white paper:
- white **anggrek bulan** (moth orchid, *Phalaenopsis*; one of Indonesia's national flowers), with a few blush-pink ones;
- big **monstera**, **banana** and **palm** leaves in deep and fresh greens;
- small accents of coral **heliconia** and soft gold;
- on wide screens, a misty line of coconut palms.

It is the bright, green look of *Taman & Bunga*, for garden, beach and resort weddings. Jepun Prada uses frangipani, so frangipani stays out of this one.

**Motion (suggested):** `exit: "curtain"` (the huge leaves gather to the sides), `signature: ["drift", "sway"]` (a slow tropical breeze in the bands, the leaves over the closing moving). If Prompt 8 is delivered, the far palms trail the hero's scroll and the near leaves move ahead of it.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) and Prompt 8 (depth layers) are optional.** If Gemini refuses the texture or paints something with objects in it, skip it; I generate the texture in code. Without Prompt 8 the hero still moves; with it, it gains real depth.
4. If one is off, correct it in the same chat instead of starting a new chat.
5. File names don't matter. Drop everything into the repo's `assets/` folder.

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Cut-out pieces use flat cobalt blue (#2340C8).** The palette is greens, white, blush and coral, with no blue.
- **The sprite sheet floats on plain key colour.** Palembang's was the first that came back flat; the wording that did it stays.
- **Depth layers:** the far layer touches the bottom edge, and the near layer hangs from the top only. Both worked last time.
- **Leaf edges must be crisp**, with no blue in the leaf tips or between the monstera holes.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Anggrek Bulan". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Lush botanical gouache and watercolour on warm white paper, like a high-end printed invitation for a tropical garden or beach wedding. Rich layered greens, crisp leaf edges, soft natural light, luminous white orchids. Generous empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Paper: warm white, base colour #FBF8F1, with a faint paper grain.
- Leaves (the main element): deep green (#1F4D3A), fresh green (#4E8A5B), soft sage highlights (#A7C4A0).
- Orchids: white anggrek bulan (#FBFAF6) with pale yellow throats and a few blush-pink ones (#EBC2C4).
- Accents: coral heliconia (#E0674F), and a touch of soft gold (#C9A55C) on a few leaf veins.
- No blue anywhere.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no animals, no birds, no buildings, no frangipani, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: large monstera and banana leaves sweeping in from the TOP-LEFT and TOP-RIGHT corners, with a spray of white anggrek bulan arching across the top edge, filling roughly the top 24%. A smaller cluster of palm fronds, monstera and two blush orchids grows from the BOTTOM-RIGHT corner, filling roughly the bottom 16%, with one coral heliconia.
The CENTRE — from 27% to 82% of the height, the middle 76% of the width — must be calm, empty paper (#FBF8F1) with only faint grain. No leaf tips, petals or splashes in that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: lush walls of monstera, banana and palm leaves with white orchid sprays rising along the LEFT and RIGHT edges, each about 21% of the width; along the very bottom edge, a faint misty line of coconut palms fading into the paper. The CENTRE 56% of the width, top to bottom, is calm empty paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 26% only): a canopy of monstera and palm leaves across the top edge with a long arching spray of white anggrek bulan hanging below it at the centre. Every leaf tip and orchid ends by 26% of the height.
BOTTOM BAND (bottom 20% only): a low bed of banana leaves, monstera and small palm fronds along the bottom edge with two blush orchids and one coral heliconia, slightly taller at the corners. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an open OVAL wreath of tropical leaves: a fine gold ring with small monstera and palm leaves wound around it, fuller at the bottom-left (a spray of white anggrek bulan and a coral heliconia) and at the top-right (two blush orchids), lighter elsewhere. The oval's outer edge is about 88% of the image width; its opening is about 68% of the width and 70% of the height, centred. Crisp leaf edges, with no background colour in them or in the monstera holes.
The inside of the oval and everything outside the wreath must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner spray anchored in the TOP-LEFT corner: a large monstera leaf and palm fronds with an arching spray of white anggrek bulan, trailing diagonally toward the centre. It fills about the top-left 55% of the square. Crisp edges.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a single white anggrek bulan flower, 2) a single blush orchid petal, 3) a small monstera leaf, 4) a small palm leaflet, 5) a coral heliconia bract, 6) a small fresh-green leaf with a fine gold vein.
Each element about 60% of its grid cell, solid colour with soft shading (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 across the WHOLE square, top to bottom and edge to edge. The elements float in empty space: do NOT paint a floor, a table, ground, sand, water, mist, haze, a shadow or a reflection anywhere, including the bottom third of the square, which is plain cobalt.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of warm white watercolour paper (#FBF8F1) with a faint natural grain, evenly lit from edge to edge, no pattern, no objects, no stains, no vignette, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: a soft, pale line of coconut palms and low tropical shrubs, washed out and lighter than everything else in the set, filling the BOTTOM 30% of the image. They run off the bottom edge: there is NO blue key below them, and the image's bottom edge cuts through them. Their top edge is a clear outline of palm crowns against the background, not mist fading into it.
Everything above, from the top edge down to 70% of the height, must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: two or three huge monstera and banana leaves, very close to the viewer and slightly soft, hanging ONLY from the TOP edge at the LEFT and RIGHT, cropped by the sides, each reaching no more than 18% of the width into the picture and ending above 50% of the height. Nothing else anywhere in the image: no leaves or flowers lower down.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no frangipani, animals or birds.
- [ ] Prompts 1, 2, 3: the empty zones really are empty.
- [ ] Prompts 4, 5, 6 and 8: the background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch, and crisp leaf edges.
- [ ] Prompt 8a: the palms touch the bottom edge. Prompt 8b: leaves at the top only.
- [ ] All look like one set: same greens, same white orchids, same warm white paper.

**For a reviewer:** this theme has no regional or religious elements. Please check whether the anggrek bulan reads as festive and Indonesian, and whether the tropical greens suit couples outside Bali and the beach venues as well.
