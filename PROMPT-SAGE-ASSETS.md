# Prompts for the Sage pack art (Gemini image generation)

**Theme:** "Taman Sage". Fresh, airy watercolour greenery on white paper:
- eucalyptus, olive branches and soft ferns;
- white garden roses, blush ranunculus and baby's breath;
- a touch of muted gold.

The bright, modern counterpart to Floral (dark wine) and Javanese (ivory adat), and the style most Indonesian couples ask for.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–7 one at a time, choosing the aspect ratio each one names.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. Download each image at full size with the file name shown, and **drop them all into the repo's `assets/` folder**.

**Built in from the first two themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Cut-out pieces use flat cobalt blue (#2340C8).** White flowers on a white page can't be cut out from white, and cobalt appears nowhere in a sage, white and blush palette. Javanese's teal worked perfectly for the same reason.
- **Watercolour has soft, bleeding edges.** On the cut-out pieces, ask for "clean edges, no paint splatter or bleed into the background", otherwise blue tints get into the washes.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Taman Sage". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Loose, airy botanical watercolour on cold-press white paper, like a high-end printed garden-wedding invitation. Transparent layered washes, soft gradients inside leaves and petals, delicate fine-line stems. Light and fresh, lots of breathing room.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon, NOT heavy or dark.

PALETTE
- Paper: clean warm white, base colour #FBFAF6, with a very faint cold-press paper grain.
- Greenery (the main element): sage and eucalyptus (#9CAF98, #7E968F, blue-grey #8FA3A3), olive leaves (#8C9A6B), a few darker accents (#5E7360).
- Flowers (accents, not the main mass): white garden roses, blush-pink ranunculus (#E8C4B8), tiny white baby's breath.
- Gold: muted gold (#B89A5E) only as a few fine leaf veins or tiny dots.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no buildings, no vases, no birds or butterflies.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait.png`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: an asymmetric, airy garland of eucalyptus, olive branches, white roses and blush ranunculus sweeping across the TOP-LEFT corner and along the top edge, filling roughly the top 24% (a little deeper on the left). A smaller matching cluster grows from the BOTTOM-RIGHT corner, filling roughly the bottom 18%, with a few long stems reaching up the right edge.
The CENTRE — from 28% to 80% of the height, full width — must be calm, empty white paper with only faint grain. No leaves, stems, petals or paint splashes in that zone. The couple's names, the guest's name and a button go there.
Keep the important flowers within the central 80% of the width so the image can be cropped slightly at the sides on narrow phones.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop.png`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: tall, airy arrangements of eucalyptus, olive and white roses rising along the LEFT and RIGHT edges, each about 20% of the width, with a few branches arching in from the top corners. The CENTRE 58% of the width, top to bottom, is calm empty white paper for text.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero.png`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 28% only): a soft, symmetrical swag of eucalyptus and olive branches hanging from the top edge, with two white roses and sprigs of baby's breath at the centre. Everything in this band must end by 28% of the height — leaf tips included.
BOTTOM BAND (bottom 22% only): a low, wide meadow of ferns, eucalyptus and a few blush ranunculus along the bottom edge, slightly taller at the left and right corners. Nothing rises above 78% of the height.
MIDDLE (from 28% to 78%): completely empty white paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: wreath for photos

File: **`photo-ring.png`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint a light, open OVAL wreath of eucalyptus and olive branches, fuller at the bottom-left (two white roses, a blush ranunculus, baby's breath) and at the top-right (one white rose and baby's breath), with thin airy branches around the rest of the oval. The oval's outer edge is about 88% of the image width; its opening is about 70% of the width and 70% of the height, centred.
Clean, crisp edges — no paint splatter or watercolour bleed outside the leaves.
The inside of the oval and everything outside the wreath must be completely flat, uniform, plain cobalt blue #2340C8 — no texture, no shadow, no gradient — so I can cut it out cleanly.
```

## Prompt 5: corner spray

File: **`corner-tl.png`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner spray anchored in the TOP-LEFT corner: eucalyptus and olive branches with one white rose, a blush ranunculus bud and baby's breath, trailing diagonally toward the centre and ending in fine leaf tips. It fills about the top-left 55% of the square.
Clean, crisp edges — no paint splatter or watercolour bleed.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — no texture, no shadow — so I can cut it out cleanly. Nothing touches the bottom or right edge.
```

## Prompt 6: falling sprites

File: **`petals-sheet.png`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a single white rose petal, 2) a single blush ranunculus petal, 3) a small round eucalyptus leaf, 4) a slim olive leaf, 5) a tiny sprig of baby's breath, 6) a small sage leaf with a fine gold vein.
Each element about 60% of its grid cell, soft watercolour shading but solid colour (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 — no texture, no shadows on the background.
```

## Prompt 7: page texture

File: **`texture.png`** · Aspect ratio **1:1** (square)

```
Image 7 of the set. Square 1:1.
A close-up, seamless, tileable texture of clean warm-white cold-press watercolour paper in #FBFAF6, with soft natural grain and the faintest hint of fibres. No paint, no stains, no objects, no vignette, no lighting gradient — evenly lit from edge to edge so it can repeat without visible seams.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] Prompts 1, 2, 3: the empty zones really are empty: no stray leaves, stems or paint splashes.
- [ ] Prompts 4, 5, 6: the background is one flat **cobalt blue**, and the edges are crisp, with no blue tint inside the washes.
- [ ] All seven look like one set: same watercolour style, same greens, same flowers.
- [ ] Downloaded at the largest size Gemini offers.
