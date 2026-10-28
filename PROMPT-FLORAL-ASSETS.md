# Prompts for the Floral pack art (Gemini image generation)

**Tool:** Gemini (gemini.google.com, image generation). It is best at this painted look. Claude Design is better for line-art SVG; the few line ornaments this pack needs (divider, heading ornament, monogram frame) I'll draw in code, so you only need Gemini.

**How to use:**
1. Open **one** Gemini chat. Paste **Prompt 0** first; it sets the style for everything after.
2. In the same chat, paste Prompts 1–7 one at a time. Choose the aspect ratio named in each prompt if Gemini offers a picker.
3. When one comes out right, download it at full size and give it the file name shown. If it's wrong, reply in the same chat ("less greenery at the top", "make the centre emptier") instead of starting over, so the style stays consistent.
4. Put all the files in one folder and give me the path, or drag them into this chat.

**What I do with them:**
- crop and resize each one to its slot;
- remove the flat background on the cut-out pieces;
- encode AVIF/WebP/JPEG within the size budgets;
- build the pack (colours, fonts, layout), add visual tests, and show you screenshots.

**Why the cut-out pieces use a flat wine-red background:** Gemini can't export transparent images. Painting the cut-outs on the page's own colour means any soft edge left after I remove the background is invisible on the page.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital wedding invitation theme called "Floral – Merah Anggur" (wine red). Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted botanical illustration, oil/gouache on textured paper, rich and luxurious, like a high-end printed wedding invitation. Soft painterly edges, visible brush texture, gentle shadows, no harsh outlines.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon, NOT flat.

PALETTE
- Background: deep wine / burgundy velvet, base colour #4A0E1C, with subtle darker vignette (#2E0711) and faint mottled paper texture.
- Flowers: wine red, deep plum, dusty rose, a few cream/ivory blooms for contrast.
- Greenery: muted olive and sage, never bright green.
- Accents: antique gold (#C9A55C) only as small highlights (stamens, a few fine tendrils).

FLOWERS (use this mix in every image)
- Large garden peonies in wine and dusty rose (the main mass).
- Moth orchids (Phalaenopsis) in plum and white — the white "anggrek bulan" is Indonesia's national flower; include at least one cluster.
- Small white jasmine (melati) buds and sprays as delicate accents.
- Trailing amaranthus and willow-like hanging greenery, eucalyptus, a few dark berries.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders drawn around the image.
- No people, no buildings, no vases unless I ask.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait.png`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted (no transparency).
Composition: a lush cascade of peonies, orchids and trailing amaranthus hanging down from the TOP edge, filling roughly the top 30% and spilling a little down the left and right sides. A smaller arrangement rises from the BOTTOM edge, filling roughly the bottom 22%, with a few jasmine sprays and orchid stems reaching upward.
The CENTRE (from about 32% to 76% of the height, full width) must be calm, empty wine-velvet background with only soft vignette and paper texture — this is where the couple's names, the guest's name and a button will go. Do not put any flowers, leaves or petals in that centre zone.
Keep the important flowers within the central 80% of the width so the image can be cropped slightly at the sides on narrow phones.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop.png`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style and flowers as image 1. Landscape 16:9, full-bleed, fully painted.
Composition: flowers frame the LEFT and RIGHT edges — a tall arrangement on each side, about 22% of the width each, with hanging greenery from the top corners. The CENTRE 55% of the width, top to bottom, is calm empty wine-velvet background for text. No flowers in the centre.
```

## Prompt 3: bottom flower bank over the couple's photo

File: **`hero-overlay.png`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16.
Paint ONLY a dense, low arrangement of peonies, orchids, jasmine and greenery along the BOTTOM edge, about 25% of the height, with a few stems reaching up the left and right edges to about 45% height. The arrangement must look complete on its own, as if it is placed in front of a photograph.
Everything else — the whole upper and middle area — must be completely flat, uniform, plain colour #4A0E1C with NO texture, NO vignette, NO gradient, NO shadow, so I can cut the flowers out cleanly. The flowers must not touch the top edge.
```

## Prompt 4: corner spray

File: **`corner-tl.png`** · Aspect ratio **1:1** (square)

```
Image 4 of the set, same style. Square 1:1.
Paint ONE corner floral spray anchored in the TOP-LEFT corner: two peonies, an orchid stem and jasmine sprays, with greenery and amaranthus trailing diagonally toward the centre of the image and ending in fine tendrils. It should fill about the top-left 60% of the square, thinning out toward the bottom-right.
The background everywhere else must be completely flat, uniform, plain colour #4A0E1C — no texture, no vignette, no shadow — so I can cut the flowers out cleanly. Nothing touches the bottom or right edge.
```

## Prompt 5: falling petals

File: **`petals-sheet.png`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a wine-red peony petal, 2) a dusty-rose peony petal curled at one edge, 3) a small white jasmine flower seen from above, 4) a single white orchid petal, 5) a small olive eucalyptus leaf, 6) a tiny gold-tinged jasmine bud.
Each element should be about 70% of its grid cell, softly lit, slightly tilted at different angles.
Background: completely flat, uniform, plain colour #4A0E1C — no texture, no shadows on the background.
```

## Prompt 6: page texture

File: **`texture.png`** · Aspect ratio **1:1** (square)

```
Image 6 of the set. Square 1:1.
A close-up, seamless, tileable texture of deep wine velvet / heavy watercolour paper in #4A0E1C with very subtle mottling and fibres. No flowers, no objects, no vignette, no lighting gradient — evenly lit from edge to edge so it can repeat as a pattern without visible seams.
```

## Prompt 7: ring around profile photos (optional)

File: **`photo-ring.png`** · Aspect ratio **4:5** (portrait)

```
Image 7 of the set, same style. Portrait 4:5.
Paint a delicate floral wreath forming an OVAL ring: small peonies, jasmine and orchid sprigs clustered at the bottom-left and top-right of the oval, with thin greenery connecting them around the rest of the oval. The oval should be about 80% of the image width.
The inside of the oval and everything outside the wreath must be completely flat, uniform, plain colour #4A0E1C — no texture, no shadow — so I can cut it out. The couple's photo will appear inside the oval.
```

---

## Checklist before you send them back

- [ ] No text, letters or watermark anywhere.
- [ ] Prompts 1–2: the centre area really is empty.
- [ ] Prompts 3, 4, 5, 7: the background is one flat colour, with no texture or shadow behind the flowers.
- [ ] All seven look like one set: same paint style, same reds, same flowers.
- [ ] Downloaded at the largest size Gemini offers. I upscale if needed, but a bigger source is always better.
