# Prompts for the Lavender pack art (Gemini image generation)

**Theme:** "Wisteria Lila". A soft, romantic pastel garden:
- long hanging **wisteria** racemes in lilac and pale violet;
- **lavender** sprigs, white sweet peas and pale lilac roses;
- silver-sage leaves and a touch of **soft silver**;
- on wide screens, a wisteria-covered arbour fading into a pale lavender field.

It is the light, dreamy look of *Taman & Bunga*, between Taman Sage's fresh green and Merah Anggur's dark wine. Many couples ask for this palette under the name "ungu / lilac".

**Motion (suggested):** `exit: "bloom"`, `signature: ["sway", "breathe"]` (the hanging wisteria sways). If Prompt 8 is delivered, the far field trails the hero's scroll and the near racemes move ahead of it.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) and Prompt 8 (depth layers) are optional.** If Gemini refuses the texture or paints something with objects in it, skip it; I generate the texture in code. Without Prompt 8 the hero still moves; with it, it gains real depth.
4. If one is off, correct it in the same chat instead of starting a new chat.
5. File names don't matter. Drop everything into the repo's `assets/` folder.

**One change from earlier themes:** cut-out pieces use flat **orange (#F08A00)**, not cobalt or magenta. Lilac and violet carry more blue than red, so cleaning blue out of the edges (cobalt) would turn them grey. Magenta is too close to the purples. Orange appears nowhere in this palette.

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Every cut-out background must be flat right to every edge.** Three sprite sheets in a row came back with a haze or ground band across the lower third. Prompt 6 now says so twice.
- **Depth layers must keep to their zone, with a clean edge against the key.** Batak's far layer came back mid-frame, with its haze fading into the key colour, which can't be cut out cleanly.
- **Fine petals and hanging tips must be crisp.** No colour from the background in them.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Wisteria Lila". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Delicate botanical watercolour on soft white cold-press paper, like a high-end printed garden-wedding invitation. Transparent layered washes, gentle gradients inside petals, fine-line stems, a dreamy light. Generous empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon, NOT heavy or dark.

PALETTE
- Paper: soft warm white, base colour #FBF8FB, with a very faint paper grain and the faintest lilac tint.
- Wisteria (the main element): lilac #C3AEDB, pale violet #A88BCB, deeper violet accents #7E62A8, with paler tips #E4D9F0.
- Flowers (accents): lavender sprigs #9A86C2, white sweet peas, pale lilac roses #D9C8E6.
- Leaves: silver-sage #A9B5A2 and soft green #8EA08A.
- Silver: soft silver #C9CBD3, only as a few fine lines or tiny dots.
- No orange, no yellow, no warm browns anywhere.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no animals, no buildings except where I ask for the arbour, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: across the TOP 24%, a canopy of wisteria hanging from the top edge, the racemes longer at the left and right sides (reaching down to 34% at the edges, but no more than 14% of the width in from each side) and short in the middle. Across the BOTTOM 16%, a low bed of lavender sprigs, white sweet peas and silver-sage leaves along the bottom edge, a little taller at the corners.
The CENTRE — from 27% to 82% of the height, the middle 72% of the width — must be calm, empty paper (#FBF8FB) with only faint grain. No racemes, petals or paint splashes in that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: on the LEFT and RIGHT, each about 22% of the width, the posts of a garden arbour wrapped in hanging wisteria, joined across the top by a soft wisteria canopy; along the very bottom edge, a faint pale lavender field fading into the paper. The CENTRE 54% of the width, top to bottom, is calm empty paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 26% only): a continuous swag of wisteria across the top edge with racemes hanging below it, the longest in the middle. Every raceme tip must end by 26% of the height.
BOTTOM BAND (bottom 20% only): a low bed of lavender, sweet peas and silver-sage leaves along the bottom edge, slightly taller at the corners. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an open OVAL wreath: a fine silver ring with wisteria racemes and silver-sage leaves wound around it, fuller at the bottom-left (a pale lilac rose, sweet peas) and at the top-right (a short hanging raceme), lighter elsewhere. The oval's outer edge is about 88% of the image width; its opening is about 68% of the width and 70% of the height, centred. Crisp edges on every petal and raceme tip, with no background colour in them.
The inside of the oval and everything outside the wreath must be completely flat, uniform, plain orange #F08A00 — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner spray anchored in the TOP-LEFT corner: a branch along the top and left edges with three long wisteria racemes hanging down from it, silver-sage leaves and a lavender sprig. It fills about the top-left 55% of the square and thins out toward the centre. Crisp edges on every petal and raceme tip.
The background everywhere else must be completely flat, uniform, plain orange #F08A00 — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a single wisteria floret, 2) a small lilac petal, 3) a white sweet-pea petal, 4) a short lavender sprig, 5) a small silver-sage leaf, 6) a pale lilac rose petal.
Each element about 60% of its grid cell, soft shading but solid colour (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain orange #F08A00 across the WHOLE square, top to bottom and edge to edge. The bottom third of the square is plain orange too: no ground, no haze, no mist, no shadow and no reflection under the elements.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of soft white cold-press watercolour paper (#FBF8FB) with a faint natural grain, evenly lit from edge to edge, no pattern, no objects, no stains, no vignette, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: a soft, pale band of a distant lavender field with a faint row of wisteria-covered arbours, across the BOTTOM 30% of the image only, sitting right on the bottom edge. Washed out and lighter than everything else in the set. Its top edge is a soft but clear outline of the field and trees against the background — do not fade it into the background colour, and no mist above it.
Everything above it, from the top edge down to 70% of the height, must be completely flat, uniform, plain orange #F08A00 — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: three long wisteria racemes and a few leaves, very close to the viewer and slightly soft, hanging from the TOP edge at the LEFT and RIGHT and cropped by the sides, each reaching no more than 18% of the width into the picture and no lower than 60% of the height. The CENTRE 64% of the width, top to bottom, is empty.
Everything else must be completely flat, uniform, plain orange #F08A00 — one even colour edge to edge, no texture, no shadow, no gradient.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] Prompts 1, 2, 3: the empty zones really are empty: no raceme tips, petals or splashes.
- [ ] Prompts 4, 5, 6 and 8: the background is one flat, even **orange** right to every edge, with no blurred patch, no haze band and no orange tint in the petals.
- [ ] Prompt 8a: the field sits on the bottom edge, with a clear top outline (no mist fading into the orange).
- [ ] All look like one set: same lilac wisteria, same silver-sage, same soft white paper.

**For a reviewer:** this theme has no regional or religious elements. Please check two things. First, that the pastel lilac palette reads as romantic and festive, not as faded or mournful. Second, wisteria doesn't grow in most of Indonesia and is known through Japanese and Korean wedding styling. Does it feel aspirational to couples here, or foreign? Would *melati* or orchids be expected alongside it?
