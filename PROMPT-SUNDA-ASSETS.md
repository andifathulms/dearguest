# Prompts for the Sunda pack art (Gemini image generation)

**Theme:** "Siger Mega Mendung". A light, regal Sundanese (West Java) wedding:
- the golden ***siger*** crown, shown on a stand as an heirloom, never worn by a figure;
- ***mega mendung*** cloud batik (the West Java / Cirebon cloud motif) in deep indigo;
- strings of ***ronce melati***;
- ***awi*** (bamboo) and rice-field hills;
- ivory paper and soft gold.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) is optional.** If Gemini refuses, skip it; I generate the texture in code.
4. File names don't matter. Drop everything into the repo's `assets/` folder.

**One change from earlier themes:** cut-out pieces use flat **magenta (#D01C8B)**, not cobalt. This palette contains indigo blue (the mega mendung clouds), so blue can't be the background to remove. Magenta appears nowhere in it.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital Sundanese wedding invitation theme called "Siger Mega Mendung". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted illustration, gouache with fine gold-leaf detail on warm paper, refined and airy like a printed invitation from a Bandung or Bogor family. Crisp ornament, soft painterly shading, generous empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: warm ivory paper, base colour #F7F1E6, with faint paper fibres.
- Gold: soft burnished gold (#C2A15A) with pale highlights (#E3CC8E).
- Mega mendung: deep indigo (#24345E) shading to soft blue-grey (#6F7FA3) in the classic layered cloud bands, with thin ivory outlines between bands.
- Accents: white melati, green bamboo (#7E9A5E), a few soft pink rose buds.
- No magenta or bright pink anywhere.

SUNDANESE ELEMENTS (use where each prompt says)
- Siger: the golden Sundanese bridal crown — a fan-shaped crest of gold filigree flowers and leaves — always shown resting on a small carved stand or cushion, never on a person.
- Mega mendung: the layered, rounded cloud motif of West Java batik, used as flowing cloud bands and borders.
- Ronce melati: long strings of jasmine buds hanging in loops.
- Awi: slender bamboo stems and leaves.
- Landscape (desktop only): soft green rice-field terraces and misty mountains in the far distance.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks.
- No people, no weapons, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: across the TOP 24%, flowing mega mendung cloud bands in indigo sweep in from both top corners and meet at the centre, where a small golden siger rests on a carved stand above them; two strings of ronce melati hang from the clouds at the sides. Across the BOTTOM 16%, softer mega mendung clouds rise from the bottom corners with slender bamboo stems at the left and right edges.
The CENTRE — from 27% to 82% of the height, full width — must be calm, empty ivory paper (#F7F1E6) with only faint fibres. Nothing hangs into that zone: no melati ends, no cloud tips. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: on the LEFT and RIGHT, each about 22% of the width, tall bamboo groves with ronce melati strings and mega mendung clouds curling around them; along the very bottom edge, faint rice-field terraces and misty blue mountains fading into the distance. The CENTRE 54% of the width, top to bottom, is calm empty ivory paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 26% only): a continuous band of mega mendung clouds across the top edge with three loops of ronce melati hanging below it and a small gold siger at the centre. Everything, melati ends included, must end by 26% of the height.
BOTTOM BAND (bottom 20% only): soft mega mendung clouds along the bottom edge with short bamboo sprigs at each corner and a few scattered melati. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty ivory paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an elegant OVAL frame: a thin gold filigree rim wrapped by a band of small mega mendung clouds in indigo, with a miniature golden siger crest at the top and a short loop of ronce melati hanging at the bottom. The oval's outer edge is about 86% of the image width; its opening is about 68% of the width and 70% of the height, centred. Clean, crisp edges.
The inside of the oval and everything outside the frame must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner ornament anchored in the TOP-LEFT corner: layered mega mendung clouds in indigo curling out of the corner, with two strings of ronce melati hanging from them and a slender bamboo sprig. It fills about the top-left 55% of the square and thins out toward the centre. Clean, crisp edges.
The background everywhere else must be completely flat, uniform, plain magenta #D01C8B — one even colour all the way to the bottom and right edges, no darker band, no texture, no shadow.
```

## Prompt 6: sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a white melati flower, 2) a closed melati bud, 3) a slender bamboo leaf, 4) a soft pink rose petal, 5) a tiny mega mendung cloud in indigo, 6) a small gold filigree flower from a siger.
Each element about 60% of its grid cell, solid colour with soft shading (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain magenta #D01C8B — no texture, no shadows on the background.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of warm ivory handmade paper (#F7F1E6) with soft natural fibres, evenly lit, no pattern, no objects, no text.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] Prompts 1, 2, 3: the empty zones really are empty.
- [ ] Prompts 4, 5, 6: the background is one flat, even **magenta** right to every edge, with crisp edges.
- [ ] All look like one set: same indigo clouds, same gold, same ivory.

**For a reviewer from West Java:** please check the siger is shown respectfully (on a stand, as an heirloom), and that using Cirebon's mega mendung alongside Sundanese elements reads right for a Sundanese wedding.
