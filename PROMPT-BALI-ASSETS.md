# Prompts for the Bali pack art (Gemini image generation)

**Theme:** "Jepun Prada". A warm Balinese wedding look on cream paper:
- the carved **candi bentar** split gate in red brick and grey *paras* stone, with *patra* floral carving;
- **prada** cloth (gold-leaf painted fabric) draped in swags;
- **jepun** (frangipani) in white and soft yellow, and woven **janur** (young coconut leaf);
- deep tropical greens;
- on wide screens, rice terraces and coconut palms.

It is the tropical, gilded look of *Pesona Nusantara*: lighter and warmer than Gebyok Sogan, with gold cloth rather than carved teak.

**Motion (suggested):** `signature: ["shimmer", "sway"]` (light across the prada gold, and the frangipani and janur moving). For the exit, the candi bentar is a gate split down the middle, so the halves should slide apart sideways. None of the current exits does that: `curtain` gathers, and `doors` swings. When building, I'll add a small `gate` exit for it, or fall back to `curtain`. If Prompt 8 is delivered, the rice terraces trail the hero's scroll, and the near frangipani moves ahead of it.

**How to use** (same as before):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–6 one at a time, choosing the aspect ratio each one names.
3. **Prompt 7 (texture) and Prompt 8 (depth layers) are optional.** If Gemini refuses the texture or paints something with objects in it, skip it; I generate the texture in code. Without Prompt 8 the hero still moves; with it, it gains real depth.
4. If one is off, correct it in the same chat instead of starting a new chat.
5. File names don't matter. Drop everything into the repo's `assets/` folder.

**Built in from earlier themes:**
- **Exact empty zones** for text, and a separate hero painting that I cut into top and bottom bands.
- **Cut-out pieces use flat cobalt blue (#2340C8).** This palette is warm (brick, stone, gold, cream, green), with no blue or violet. The sky and the terraces appear only in the opaque desktop cover, which is never keyed.
- **Every cut-out background must be flat right to every edge**, the sprite sheet's lower third included.
- **The far depth layer must touch the bottom edge of its image.** Batak's lake and Lavender's field both came back floating mid-frame with key colour below them. Prompt 8a now says so in two ways.
- **Fine detail must be crisp:** frangipani petal edges, janur strips and gold lines, with no blue in them.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital Balinese wedding invitation theme called "Jepun Prada". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted gouache with gold-leaf detail on warm cream paper, like a refined printed invitation from a Bali wedding house. Crisp carved ornament, soft tropical light, painterly shading on stone, cloth and leaves. Generous empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: warm cream paper, base colour #F7F0E3, with faint fibres.
- Brick: soft red-orange brick (#A9573D) with fine mortar lines.
- Paras stone: warm grey volcanic stone (#9C978C) for the carved panels.
- Prada: deep red or deep green cloth (#7A1F24, #2E5A3C) painted with gold-leaf floral patterns (#C9A045, highlights #E8CF86).
- Jepun (frangipani): white petals with soft yellow centres (#F2C14E); a few pale pink ones.
- Janur: pale yellow-green young coconut leaf (#D8CF8A), woven or plaited.
- Leaves: deep tropical green (#2F5D3A).
- No blue anywhere except the sky in the desktop landscape.

BALINESE ELEMENTS (use where each prompt says)
- Candi bentar: the split gateway — two tall, stepped halves of brick and carved paras stone, mirror images, with a gap in the middle. Shown as architecture only, from the front.
- Patra carving: flowing floral and leaf carving in the stone (patra punggel / patra sari style). Do NOT carve faces, demon or guardian heads (no Karang Boma), animals or figures — floral ornament only.
- Prada cloth: draped in swags or wrapped around the gate posts, with gold-leaf florals.
- Jepun and janur as garlands, sprays and woven pieces.
- Landscape (desktop only): green rice terraces with coconut palms in soft morning light.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks.
- No people, no animals, no weapons, no religious symbols: no offerings (canang sari), no penjor poles, no ceremonial umbrellas (tedung), no shrines, no statues.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: the two halves of a candi bentar rise along the LEFT and RIGHT edges, each no more than 15% of the width, their stepped tops reaching the top corners. Across the TOP 22%, a swag of red prada cloth with gold florals hangs between them, with a short garland of jepun at its centre. Across the BOTTOM 16%, stone steps along the bottom edge with jepun blossoms and a woven janur piece at each corner.
The CENTRE — from 26% to 82% of the height, the middle 70% of the width — must be calm, empty cream paper (#F7F0E3) with only faint fibres. Nothing reaches into that zone. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: on the LEFT and RIGHT, each about 20% of the width, the two halves of a candi bentar wrapped with prada cloth and jepun garlands; between them, along the very bottom edge, faint green rice terraces and coconut palms in soft morning haze, fading into the paper. The CENTRE 56% of the width, top to bottom, is calm empty cream paper for text. Nothing in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 26% only): a carved paras-stone lintel with patra florals across the full width, with three short swags of red-and-gold prada cloth and a few hanging jepun below it. Every swag and blossom ends by 26% of the height.
BOTTOM BAND (bottom 20% only): stone steps along the bottom edge with jepun blossoms, deep green leaves and a woven janur piece at each corner. Nothing rises above 80% of the height.
MIDDLE (from 26% to 80%): completely empty cream paper, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an elegant OVAL frame of carved paras stone with flowing patra florals and a fine gold-leaf inner edge, with a cluster of jepun and a short woven janur at the top, and a small swag of red prada at the bottom. The oval's outer edge is about 86% of the image width; its opening is about 66% of the width and 70% of the height, centred. Crisp edges.
The inside of the oval and everything outside the frame must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no blur — so I can cut it out cleanly.
```

## Prompt 5: corner ornament

File: **`corner-tl`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner ornament anchored in the TOP-LEFT corner: a carved paras-stone corner with patra florals along the top and left edges, a draped swag of red-and-gold prada, and a spray of jepun with deep green leaves hanging from it. It fills about the top-left 55% of the square and thins out toward the centre. Crisp edges.
The background everywhere else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour all the way to the bottom and right edges, no darker band, no blurred patch, no texture, no shadow.
```

## Prompt 6: falling sprites

File: **`petals-sheet`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) a white jepun flower with a yellow centre, 2) a single jepun petal, 3) a pale pink jepun flower, 4) a short strip of woven janur, 5) a deep green leaf, 6) a small gold-leaf floral motif like one from prada cloth.
Each element about 60% of its grid cell, solid colour with soft shading (no see-through areas), each tilted at a different angle, clean crisp edges.
Background: completely flat, uniform, plain cobalt blue #2340C8 across the WHOLE square, top to bottom and edge to edge. The bottom third of the square is plain cobalt too: no ground, no haze, no mist, no shadow and no reflection under the elements.
```

## Prompt 7: page texture (optional)

File: **`texture`** · Aspect ratio **1:1** (square)

```
Square image: a seamless background texture of warm cream handmade paper (#F7F0E3) with soft natural fibres, evenly lit from edge to edge, no pattern, no objects, no stains, no vignette, no text.
```

## Prompt 8: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image 8a of the set, same style. Portrait 9:16. A FAR layer for depth: pale green rice terraces with a few coconut palms, washed out and lighter than everything else in the set, filling the BOTTOM 30% of the image. The terraces run off the bottom edge of the image: there is NO blue below them, and their lowest row is cut by the image's bottom edge. Their top edge is a clear outline of palms and terraces against the background, not mist fading into it.
Everything above, from the top edge down to 70% of the height, must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

```
Image 8b of the set, same style. Portrait 9:16. A NEAR layer for depth: a frangipani branch with blossoms and leaves, and a hanging janur strip, very close to the viewer and slightly soft, hanging from the TOP edge at the LEFT and RIGHT and cropped by the sides, each reaching no more than 18% of the width into the picture and no lower than 55% of the height. The CENTRE 64% of the width, top to bottom, is empty.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere.
- [ ] No faces, guardian heads, animals, offerings, penjor or ceremonial umbrellas.
- [ ] Prompts 1, 2, 3: the empty zones really are empty.
- [ ] Prompts 4, 5, 6 and 8: the background is one flat, even **cobalt blue** right to every edge, with no blurred patch or haze band.
- [ ] Prompt 8a: the terraces touch the bottom edge, with no blue strip below them.
- [ ] All look like one set: same brick and paras stone, same red-and-gold prada, same jepun.

**For a reviewer from Bali:**
- The *candi bentar* appears here as a gateway, the way wedding venues and family compounds use it. It is also a temple gate. Is it appropriate on a wedding invitation?
- *Karang Boma* faces, offerings, *penjor*, *tedung* umbrellas and shrines were left out because they are religious. Would families expect any of them for a *pawiwahan*?
- In Java, *kamboja* (frangipani) is strongly linked to cemeteries, while in Bali *jepun* is everyday and festive. Guests from Java may read it differently: does that matter for a Balinese couple's invitation?
- The theme's name describes the look ("Jepun Prada"), not the ethnic group or the religion.
