# Prompts for the Minang pack art (Gemini image generation)

**Theme:** "Minang – Gonjong Songket". A Minangkabau *baralek* (wedding) in black lacquer, red and gold:
- the curved *gonjong* roof horns of the *rumah gadang*;
- carved *ukiran* (*kaluak paku* fern spirals, *pucuak rabuang* bamboo-shoot triangles);
- red-and-gold *songket*;
- the draped *langik-langik* canopy of the pelaminan;
- a brass *carano* with *sirih* and *pinang*.

It's the fifth look in the catalogue: wine, ivory, sage, emerald, and now black-red-gold.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) is optional.** If Gemini refuses it, skip it; I generate the texture in code.
4. Download each image at full size. **The file names Gemini gives don't matter**: I sort them by what's in them.
5. Drop them all into the repo's `assets/` folder.

**Carried over from the first four themes:**
- **Exact empty zones** for text.
- **A separate hero painting** with art only in the top and bottom bands.
- **Cut-out pieces on flat cobalt blue (#2340C8),** with crisp edges.
- **Ask for a uniform, even background** on cut-outs. Bugis's corner piece came back darker near the bottom, so Prompt 5 asks for that explicitly.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital Minangkabau wedding invitation theme called "Minang – Gonjong Songket". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted illustration, gouache with fine gold-leaf detail, rich and ceremonial like a printed invitation for a baralek in Bukittinggi or Padang. Crisp carved ornament, soft painterly shading on fabric. Grand but orderly, not cluttered.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: deep black lacquer, base colour #17110F, with a very subtle warm sheen.
- Red: deep Minang red (#9B1C1C) for carving panels and songket.
- Gold: warm burnished gold (#C9A24A) with lighter highlights (#E6C77A).
- Accents: brass carano, green sirih leaves, white melati.
- No blue anywhere.

MINANG ELEMENTS (use where each prompt says)
- Gonjong: the soaring, curved, horn-like roof peaks of the rumah gadang, finished in gold.
- Ukiran: carved wooden relief in red, black and gold — kaluak paku (fern-tip spirals), pucuak rabuang (bamboo-shoot triangles), itiak pulang patang (rows of ducks, as a border only).
- Songket: red silk woven with dense gold geometric motifs.
- Langik-langik: the layered, draped fabric canopy above a Minang pelaminan, in red, gold and black, with gold fringe.
- Carano: a footed brass tray with a domed lid, holding sirih leaves and pinang.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks.
- No people, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: across the TOP 24%, a rumah gadang roofline — three golden gonjong peaks sweeping upward (the middle one tallest) above a band of red-and-gold ukiran with kaluak paku spirals. Down the LEFT and RIGHT edges: narrow vertical songket borders, red with gold motifs, each about 8% of the width. Across the BOTTOM 16%: a pair of brass carano with sirih leaves, small brass bowls and a few melati, on a low red songket runner.
The CENTRE — from 27% to 82% of the height, between the borders — must be calm, empty black lacquer (#17110F) with only a faint warm sheen. Nothing hangs into that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: on the LEFT and RIGHT, each about 21% of the width, a carved rumah gadang wall panel in red, black and gold ukiran, topped by a golden gonjong peak curving inward at the top corners, with a brass carano at each bottom corner. The CENTRE 56% of the width, top to bottom, is calm empty black lacquer for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 26% only): a langik-langik canopy across the top edge — layered drapes of red and black fabric with gold songket borders and gold fringe, swagged in three soft loops. Everything, fringe included, must end by 26% of the height.
BOTTOM BAND (bottom 20% only): a low red songket runner along the bottom edge with a brass carano of sirih and pinang at the centre and small brass bowls with melati to each side. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty black lacquer, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an ornate OVAL frame of carved burnished gold with kaluak paku spirals around it, a small gonjong-shaped crest at the top and a pucuak rabuang triangle at the bottom, and a thin inner band of red songket with gold motifs. The oval's outer edge is about 88% of the image width; its opening is about 68% of the width and 70% of the height, centred. Clean, crisp edges.
The inside of the oval and everything outside the frame must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner ornament anchored in the TOP-LEFT corner: a carved corner of red-and-gold ukiran with kaluak paku spirals, a small golden gonjong tip curving up from it, and a short swag of songket with a gold tassel hanging below. It fills about the top-left 55% of the square and thins out toward the centre. Clean, crisp edges.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no texture, no shadow.
```

## Prompt 6: sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a white melati flower, 2) a heart-shaped green sirih leaf, 3) a half slice of pinang (areca nut), 4) a single deep red rose petal, 5) a small gold pucuak rabuang (triangular bamboo-shoot) sequin, 6) a small gold songket diamond sequin.
Each element about 60% of its grid cell, solid colour with soft shading (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 — no texture, no shadows on the background.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

Gemini sometimes refuses plain surfaces. If it does, skip this and I'll generate the texture in code.

```
Square image: a seamless background texture of deep black lacquered wood (#17110F) with a very fine, even grain and a faint warm sheen, evenly lit, no knots, no pattern, no objects, no text.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] Prompts 1, 2, 3: the empty zones really are empty.
- [ ] Prompts 4, 5, 6: the background is one flat, even **cobalt blue** right to every edge, with crisp edges.
- [ ] All look like one set: same gold, same red, same black.
- [ ] Downloaded at the largest size Gemini offers.

**For a reviewer from West Sumatra:** please check the gonjong, ukiran motifs, langik-langik and carano are shown respectfully, and that the black-red-gold palette suits a baralek.
