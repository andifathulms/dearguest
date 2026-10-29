# Prompts for the Palembang pack art (Gemini image generation)

**Theme:** "Limas Emas". A regal Palembang wedding in deep maroon lacquer and gold:
- the carved, gilded wall panels and stepped floors of the **rumah limas**;
- **songket limar** in red with dense gold thread, draped with its gold fringe;
- **lak** (Palembang lacquerware) florals in gold on maroon, and a lacquered **tepak sirih** box;
- *bunga cempaka* (magnolia champaca) and jasmine;
- on wide screens, the Musi river at dawn with stilt houses in the distance.

It is the most opulent look in *Pesona Nusantara*. Gonjong Songket puts gold on black lacquer; this one is gold on **deep maroon**, with florals instead of roof horns.

**Motion (suggested):** `exit: "doors"` (the carved double doors of the rumah limas), `signature: ["shimmer", "breathe"]` (light running over the gold lacquer and the songket thread). If Prompt 8 is delivered, the river trails the hero's scroll and the near songket moves ahead of it.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) and Prompt 8 (depth layers) are optional.** If Gemini refuses the texture or paints something with objects in it, skip it; I generate the texture in code. Without Prompt 8 the hero still moves; with it, it gains real depth.
4. If one is off, correct it in the same chat instead of starting a new chat.
5. File names don't matter. Drop everything into the repo's `assets/` folder.

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Cut-out pieces use flat cobalt blue (#2340C8).** The palette is maroon, red, gold, ivory and green, with no blue. The river and sky appear only in the opaque desktop cover, which is never keyed.
- **The ground is dark.** Every painting is on deep maroon lacquer, so gold edges and thin fringe must be crisp, with no blue in them.
- **The sprite sheet's lower third must be plain key colour.** Six sheets in a row came back with a haze, steps or a floor; Prompt 6 names each and says no.
- **The near depth layer hangs from the top only.** Navy's came back with an extra cluster at the bottom, which floated over the text.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital Palembang wedding invitation theme called "Limas Emas". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted gouache with gold-leaf detail on deep maroon lacquer, like a luxurious printed invitation from a Palembang wedding house. Rich and regal, crisp carved ornament, soft warm candlelight, painterly shading on wood, cloth and flowers. Generous dark empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: deep maroon lacquer, base colour #4A0E14, with a faint lacquer sheen.
- Gold: burnished gold leaf (#C99A3C) with bright highlights (#F0D58A).
- Songket limar: red (#9B1B22) woven with dense gold thread, with a gold fringe.
- Wood: dark teak (#3A2014) under the gold carving.
- Flowers: ivory-cream cempaka (#F2E6C8) and white jasmine; leaves deep green (#2F4A2E).
- No blue anywhere except the river and sky in the desktop landscape.

PALEMBANG ELEMENTS (use where each prompt says)
- Rumah limas: the carved and gilded wooden wall panels (gold floral carving on red and black), stepped floor levels (kekijing) and carved double doors. Shown as architecture only, from the inside or front.
- Lak florals: Palembang lacquer ornament — gold flowers, leaves and tendrils painted on maroon.
- Songket limar: draped or folded red-and-gold cloth with its fringe — never worn by a person.
- Tepak sirih: a small lacquered box in gold and maroon.
- Landscape (desktop only): the wide Musi river at dawn with wooden stilt houses on the far bank.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks.
- No people, no animals, no weapons, no religious symbols, no crowns or headdresses, no bridge.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted on deep maroon lacquer.
Composition: across the TOP 22%, a carved and gilded rumah limas lintel with gold lak florals, with a swag of red-and-gold songket limar hanging below it and its gold fringe. Down the LEFT and RIGHT edges, narrow carved gold panels, each no more than 12% of the width. Across the BOTTOM 16%, the stepped edge of a rumah limas floor along the bottom with a small lacquered tepak sirih at the left and a spray of cempaka at the right.
The CENTRE — from 26% to 82% of the height, the middle 76% of the width — must be calm, empty maroon lacquer (#4A0E14). Nothing reaches into that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: on the LEFT and RIGHT, each about 20% of the width, the carved, gilded open double doors of a rumah limas, with draped songket limar and cempaka; between them, along the very bottom edge, a faint view of the Musi river at dawn with stilt houses on the far bank, fading into the maroon. The CENTRE 56% of the width, top to bottom, is calm empty maroon lacquer for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted on deep maroon lacquer.
TOP BAND (top 26% only): a carved gilded lintel with gold lak florals across the full width, with three short swags of red-and-gold songket limar below it, their gold fringe ending by 26% of the height.
BOTTOM BAND (bottom 20% only): the stepped edge of a rumah limas floor along the bottom with cempaka, jasmine and deep green leaves at each corner. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty maroon lacquer, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an elegant OVAL frame of carved gilded wood with gold lak florals and tendrils, with a cluster of cempaka at the top and a short folded songket limar with its gold fringe at the bottom. The oval's outer edge is about 86% of the image width; its opening is about 66% of the width and 70% of the height, centred. Crisp edges on the gold and on every fringe thread.
The inside of the oval and everything outside the frame must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner ornament anchored in the TOP-LEFT corner: a carved gilded corner bracket with gold lak florals along the top and left edges, a draped swag of red-and-gold songket limar with its fringe, and a spray of cempaka and jasmine. It fills about the top-left 55% of the square and thins out toward the centre. Crisp edges.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) an ivory cempaka flower, 2) a single cempaka petal, 3) a white jasmine flower, 4) a small gold lak flower motif, 5) a short gold songket fringe tassel, 6) a deep green leaf.
Each element about 60% of its grid cell, solid colour with soft shading (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 across the WHOLE square, top to bottom and edge to edge. The elements float in empty space: do NOT paint a floor, a table, steps, ground, mist, haze, a shadow or a reflection anywhere, including the bottom third of the square, which is plain cobalt.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of deep maroon lacquer (#4A0E14) with a very faint even sheen, evenly lit from edge to edge, no pattern, no objects, no streaks, no vignette, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: the Musi river at dawn with a row of wooden stilt houses on the far bank, pale and washed out, dimmer than everything else in the set, filling the BOTTOM 30% of the image. The river runs off the bottom edge of the image: there is NO blue key below it, and the image's bottom edge cuts through the water. The houses' rooftops form a clear outline against the background at the top, not mist fading into it.
Everything above, from the top edge down to 70% of the height, must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: the ends of two red-and-gold songket limar drapes with their gold fringe, very close to the viewer and slightly soft, hanging ONLY from the TOP edge at the LEFT and RIGHT, cropped by the sides, each reaching no more than 16% of the width into the picture and ending above 50% of the height. Nothing else anywhere in the image: no flowers or clusters lower down.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people, crowns or headdresses; no bridge.
- [ ] Prompts 1, 2, 3: the empty zones really are empty maroon.
- [ ] Prompts 4, 5, 6 and 8: the background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch, and crisp gold and fringe.
- [ ] Prompt 8a: the river touches the bottom edge. Prompt 8b: drapes at the top only.
- [ ] All look like one set: same maroon lacquer, same gold lak florals, same red songket.

**For a reviewer from Palembang:**
- *Aesan gede*, *paksangko* and *tanjak* are left out because they are worn. The songket is shown only draped or folded. Please check that this reads as respectful.
- Is *bunga cempaka* (with jasmine) the right flower for a Palembang wedding, or would *teratai* (lotus), common in Palembang carving, be expected? It was left out because of its religious associations elsewhere.
- Is deep maroon lacquer (*lak*) recognisably Palembang, rather than generic Malay?
- The pack's name describes the look ("Limas Emas"), not the ethnic group.
