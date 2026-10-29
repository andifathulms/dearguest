# Prompts for the Navy pack art (Gemini image generation)

**Theme:** "Mawar Malam". White blooms on deep navy, like a garden by moonlight:
- **white garden roses, peonies and ranunculus**, with sprigs of baby's breath;
- dusty-blue **eucalyptus** and silver-green leaves;
- very fine **gold** lines on a few leaves and stems;
- on wide screens, moonlit white flowering shrubs fading into the dark.

It is the dark, elegant look of *Taman & Bunga* and Merah Anggur's cool counterpart: navy and white where that one is wine and blush. It suits evening receptions.

**Motion (suggested):** `exit: "part"` (the top garland lifts, the bottom bed sinks), `signature: ["sway", "shimmer"]` (blooms moving, light catching the gold lines). If Prompt 8 is delivered, the far shrubs trail the hero's scroll and the near roses move ahead of it.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) and Prompt 8 (depth layers) are optional.** If Gemini refuses the texture or paints something with objects in it, skip it; I generate the texture in code. Without Prompt 8 the hero still moves; with it, it gains real depth.
4. If one is off, correct it in the same chat instead of starting a new chat.
5. File names don't matter. Drop everything into the repo's `assets/` folder.

**Cut-out pieces use flat magenta (#D01C8B).** The palette is navy and dusty blue, so cobalt can't be the background to remove. There is no pink anywhere in this palette, so magenta keys out cleanly.

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **The ground is dark.** Every painting is on navy paper, so the cut-outs must hold up over navy as well. White petals need crisp edges with no magenta in them.
- **The sprite sheet's lower third must be plain key colour.** Five sheets in a row came back with a haze, steps or a floor under the elements. Prompt 6 now names each of those and says no.
- **The far depth layer must touch the bottom edge.** That wording worked for Bali; it stays.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Mawar Malam". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted gouache and watercolour botanical illustration on deep navy paper, like a luxurious dark-ground printed invitation. Luminous white petals with soft blue-grey shading, delicate fine-line stems, a hush of moonlight. Generous dark empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon, NOT neon.

PALETTE
- Background paper: deep navy, base colour #14213D, with a very faint paper grain.
- Flowers (the main element): white garden roses, peonies and ranunculus (#F6F4EF) shaded with cool blue-grey (#BFC8D6), creamy centres (#EDE3CC); tiny white baby's breath.
- Leaves: dusty-blue eucalyptus (#7F97AC), silver-green leaves (#A4B3A6), a few deeper blue-green leaves (#3E5866).
- Gold: very fine burnished gold lines (#C8A75E) on a few leaf veins and stems only.
- No pink, no magenta, no red anywhere.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no animals, no buildings, no vases, no moon or stars drawn as objects, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted on deep navy.
Composition: an asymmetric garland of white roses, peonies, eucalyptus and baby's breath sweeping across the TOP-RIGHT corner and along the top edge, filling roughly the top 24% (a little deeper on the right). A smaller matching cluster grows from the BOTTOM-LEFT corner, filling roughly the bottom 16%, with two long eucalyptus stems leaning up the left edge.
The CENTRE — from 27% to 82% of the height, the middle 76% of the width — must be calm, empty navy paper (#14213D) with only faint grain. No petals, stems or splashes in that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted on deep navy.
Composition: tall arrangements of white roses, peonies and eucalyptus rising along the LEFT and RIGHT edges, each about 21% of the width; along the very bottom edge, faint white flowering shrubs in moonlight fading into the dark. The CENTRE 56% of the width, top to bottom, is calm empty navy paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted on deep navy.
TOP BAND (top 26% only): a soft, symmetrical garland of white roses, peonies and eucalyptus hanging from the top edge, fullest at the centre. Every petal and leaf tip ends by 26% of the height.
BOTTOM BAND (bottom 20% only): a low bed of white ranunculus, baby's breath and dusty-blue leaves along the bottom edge, slightly taller at the corners. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty navy paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an open OVAL wreath: a fine gold ring with eucalyptus and silver-green leaves wound around it, fuller at the bottom-left (two white roses, a peony, baby's breath) and at the top-right (one white ranunculus), lighter elsewhere. The oval's outer edge is about 88% of the image width; its opening is about 68% of the width and 70% of the height, centred. Crisp edges on every white petal, with no background colour in them.
The inside of the oval and everything outside the wreath must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner spray anchored in the TOP-LEFT corner: white roses and a peony with eucalyptus and baby's breath, trailing diagonally toward the centre and ending in fine leaf tips. It fills about the top-left 55% of the square. Crisp edges on every petal.
The background everywhere else must be completely flat, uniform, plain magenta #D01C8B — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a single white rose petal, 2) a single white peony petal, 3) a small round eucalyptus leaf, 4) a sprig of baby's breath, 5) a silver-green leaf with a fine gold vein, 6) a small white ranunculus.
Each element about 60% of its grid cell, soft shading but solid colour (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain magenta #D01C8B across the WHOLE square, top to bottom and edge to edge. The elements float in empty space: do NOT paint a floor, a table, steps, ground, grass, mist, haze, a shadow or a reflection anywhere, including the bottom third of the square, which is plain magenta.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of deep navy paper (#14213D) with a very faint natural grain, evenly lit from edge to edge, no pattern, no objects, no stains, no vignette, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: soft, pale-blue silhouettes of white flowering shrubs and a few slender trees in moonlight, washed out and dimmer than everything else in the set, filling the BOTTOM 30% of the image. They run off the bottom edge of the image: there is NO magenta below them, and the image's bottom edge cuts through them. Their top edge is a clear outline of shrubs and trees against the background, not mist fading into it.
Everything above, from the top edge down to 70% of the height, must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: a few large white roses with eucalyptus, very close to the viewer and slightly soft, hanging from the TOP edge at the LEFT and RIGHT and cropped by the sides, each reaching no more than 18% of the width into the picture and no lower than 55% of the height. The CENTRE 64% of the width, top to bottom, is empty.
Everything else must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] Prompts 1, 2, 3: the empty zones really are empty navy.
- [ ] Prompts 4, 5, 6 and 8: the background is one flat, even **magenta** right to every edge, with no floor, haze or blurred patch, and no pink tint in the white petals.
- [ ] Prompt 8a: the shrubs touch the bottom edge, with no magenta strip below them.
- [ ] All look like one set: same navy, same white blooms, same dusty-blue eucalyptus.

**For a reviewer:** this theme has no regional or religious elements. Please check whether a dark navy invitation reads as elegant and celebratory to Indonesian families, or as too sombre. Would it need a warmer accent (gold, blush) to feel festive?
