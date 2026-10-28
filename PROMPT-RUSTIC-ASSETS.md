# Prompts for the Rustic pack art (Gemini image generation)

**Theme:** "Pampas Kraft". A warm, earthy, rustic garden wedding:
- creamy **pampas grass** plumes and dried **bunny-tail** grass;
- **dried flowers**: terracotta and dusty-rose roses, rust strawflowers, wheat and bleached ruscus;
- **eucalyptus** in muted grey-green;
- hand-made **kraft paper** with a twine bow here and there.

The *Taman & Bunga* answer to the heritage themes: the outdoor "kebun" / barn look many Indonesian couples ask for. It sits between Taman Sage (fresh and white) and Merah Anggur (dark and dramatic).

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) is optional.** If Gemini refuses or paints something with objects in it, skip it; I generate the texture in code.
4. If one is off, correct it in the same chat instead of starting a new chat.
5. File names don't matter. Drop everything into the repo's `assets/` folder.

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Cut-out pieces use flat cobalt blue (#2340C8).** The palette is all browns, creams and rusts, with no blue anywhere, so cobalt keys out cleanly. (Sunda used magenta because its clouds were indigo.)
- **Pampas is feathery.** On the cut-out pieces, ask for "soft but defined plumes, no loose hairs drifting into the background". Otherwise the plumes turn into blue-tinted fuzz when cut out.
- **The sprite sheet must be flat cobalt right to the bottom edge.** The Sunda sheet came back with a painted misty band across its lower 40%.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Pampas Kraft". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted gouache and watercolour botanical illustration on warm kraft paper, like a high-end letterpress invitation for a rustic garden or barn wedding. Soft, matte, dry-brush texture in the grasses; delicate fine-line stems; warm late-afternoon light. Generous empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon, NOT boho clip-art.

PALETTE
- Paper: warm light kraft, base colour #E9D9BF, with faint natural fibres and flecks.
- Pampas and grasses (the main element): cream #F3EAD8 shading to oat #D8C3A0 and wheat #C9A66B.
- Dried flowers (accents): terracotta #B9643F, dusty rose #C99088, rust #9A4A2A, a little bleached ivory.
- Leaves: muted eucalyptus grey-green #8E9A84 and dried ruscus #B8A27A.
- Details: natural jute twine #A88B5E, a deep brown #4A3424 for the finest stems only.
- No blue anywhere.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no animals, no buildings, no vases, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted on kraft paper.
Composition: a loose, asymmetric arrangement of pampas plumes, bunny-tail grass, dried terracotta and dusty-rose roses and eucalyptus sweeping in from the TOP-RIGHT corner and along the top edge, filling roughly the top 24% (a little deeper on the right). A smaller matching cluster with a small jute twine bow grows from the BOTTOM-LEFT corner, filling roughly the bottom 17%, with two pampas plumes leaning up the left edge.
The CENTRE — from 27% to 82% of the height, full width — must be calm, empty kraft paper (#E9D9BF) with only faint fibres. No plume tips, stems, petals or paint splashes in that zone. The couple's names, the guest's name and a button go there.
Keep the important flowers within the central 80% of the width so the image can be cropped slightly at the sides on narrow phones.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted on kraft paper.
Composition: tall pampas plumes, wheat and dried roses rising along the LEFT and RIGHT edges, each about 21% of the width, leaning gently outward, with a few plumes arching in from the top corners. The CENTRE 56% of the width, top to bottom, is calm empty kraft paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted on kraft paper.
TOP BAND (top 26% only): a soft, symmetrical swag of pampas plumes and eucalyptus hanging from the top edge, gathered at the centre with a jute twine bow and two dried terracotta roses. Everything in this band, plume tips and twine ends included, must end by 26% of the height.
BOTTOM BAND (bottom 20% only): a low, wide meadow of bunny-tail grass, wheat, small dried strawflowers and ruscus along the bottom edge, slightly taller at the left and right corners. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty kraft paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval wreath for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an open OVAL wreath of dried grasses: a thin ring of wrapped jute twine as the base, fuller at the bottom-left (pampas plumes, two dried roses in terracotta and dusty rose, wheat) and at the top-right (bunny-tail grass and one rust strawflower), with light eucalyptus and ruscus around the rest of the oval. The oval's outer edge is about 88% of the image width; its opening is about 68% of the width and 70% of the height, centred.
Soft but defined plumes with clean, crisp edges — no loose hairs drifting into the background, no paint splatter.
The inside of the oval and everything outside the wreath must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient — so I can cut it out cleanly.
```

## Prompt 5: corner spray

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner spray anchored in the TOP-LEFT corner: two pampas plumes and bunny-tail grass fanning out of the corner, with a dried dusty-rose rose, a sprig of wheat, eucalyptus and a short trailing end of jute twine. It fills about the top-left 55% of the square and thins out toward the centre.
Soft but defined plumes with clean, crisp edges — no loose hairs, no paint splatter.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no texture, no shadow. Nothing touches the bottom or right edge.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a single dried terracotta rose petal, 2) a single dusty-rose petal, 3) a small round eucalyptus leaf, 4) a short tuft of cream pampas, 5) a single grain-head of wheat, 6) a small rust strawflower head.
Each element about 60% of its grid cell, soft shading but solid colour (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 across the WHOLE square, top to bottom and edge to edge — no mist, no landscape, no gradient, no shadows.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a close-up, seamless, tileable texture of warm light kraft paper (#E9D9BF) with soft natural fibres and tiny flecks, evenly lit from edge to edge. No objects, no stains, no vignette, no text.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] Prompts 1, 2, 3: the empty zones really are empty: no plume tips, stems or splashes.
- [ ] Prompts 4, 5, 6: the background is one flat, even **cobalt blue** right to every edge, and the plumes are defined, not fuzzy.
- [ ] All look like one set: same kraft paper, same cream pampas, same terracotta and dusty rose.

**For a reviewer:** this theme has no regional or religious elements. Please check two things. First, that the dried-flower palette reads as warm and festive, not as faded or mournful. Second, that it suits a garden ("kebun") or outdoor reception as Indonesian couples picture one. Should fresh *melati* be added for families who expect it?
