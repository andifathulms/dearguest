# Prompts for the Javanese pack art (Gemini image generation)

**Theme:** "Jawa – Gebyok Sogan". A light, regal Javanese (Solo/Yogyakarta keraton) invitation:
- a carved teak *gebyok* doorway;
- strings of *ronce melati*;
- *kembang setaman* (melati, mawar, kantil, kenanga);
- *janur* and *kembar mayang*;
- sogan-brown batik and antique gold, on ivory parchment.

It's the light counterpart to the dark Floral theme.

**How to use** (same as Floral):
1. Open **one** Gemini chat. Paste **Prompt 0** first.
2. Paste Prompts 1–7 one at a time, choosing the aspect ratio each one names.
3. If one is off, correct it in the same chat ("make the centre emptier", "less gold") instead of starting a new chat.
4. Download each image at full size with the file name shown, and **drop them all into the repo's `assets/` folder**. I move them out, build the theme, and empty the folder again.

**What Floral taught us, built into these prompts:**
- **Empty centres are given as exact percentages.** Text needs more room than you'd think; Floral's first cover had the title touching the flowers.
- **The hero is its own painting (Prompt 3)**, with art only in the top and bottom bands. I cut those two bands out, so the hero can grow on any phone without flowers covering the names.
- **Cut-out pieces use a flat teal background (#1E8C8C).** White melati on ivory would be nearly impossible to separate cleanly; teal appears nowhere in this palette, so the cut is clean.

---

## Prompt 0: style brief (paste first, once)

```
I'm commissioning a set of matching illustrations for a digital Javanese wedding invitation theme called "Jawa – Gebyok Sogan". Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted illustration, gouache and fine ink on textured paper, refined and regal like a printed invitation from a Solo or Yogyakarta keraton family. Soft painterly shading, crisp carved-wood detail, gentle shadows. Elegant, not busy.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: warm ivory parchment, base colour #F3E9D8, with very faint paper fibres.
- Wood: carved teak in warm sogan brown (#6B4426 to #3B2416), with antique gold (#B8913F) highlights on the carving.
- Flowers: white melati (jasmine) as the main flower, cream-yellow kantil (white champak), pale yellow-green kenanga, and a few deep red mawar (roses) as accents.
- Greenery: young janur (coconut leaf, pale yellow-green) and a little dark green foliage.
- Batik: sogan brown/cream parang or sidomukti patterns only as narrow borders or on fabric — never covering large areas.

JAVANESE ELEMENTS (use where each prompt says)
- Gebyok: a carved teak wedding doorway/screen with floral relief, an arched top and side pillars.
- Ronce melati: long strings/garlands of jasmine buds hanging in loops.
- Kembang setaman: a scattering of melati, mawar, kantil and kenanga petals.
- Janur and kembar mayang: woven young coconut-leaf decorations, used at the bottom corners.

ALWAYS
- No text, no letters, no numbers, no Javanese script (aksara), no logos, no signatures, no watermarks.
- No people, no wayang figures, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt 1: cover background, phone (most important)

File: **`cover-bg-portrait.png`** · Aspect ratio **9:16** (portrait)

```
Image 1 of the set. Portrait 9:16, full-bleed, fully painted.
Composition: a carved teak gebyok doorway frames the whole image. Its arched, richly carved top fills roughly the top 26%, with ronce melati garlands hanging in two shallow loops just under the arch. Carved side pillars run down the left and right edges, each about 11% of the width. At the bottom, filling about the bottom 18%, a low step with kembar mayang and janur decorations in both corners and a scattering of kembang setaman petals.
INSIDE the doorway — from 28% to 80% of the height and between the pillars — must be calm, empty ivory parchment (#F3E9D8) with only faint paper fibres. Nothing hangs into that zone: no garland ends, no leaves, no petals. The couple's names, the guest's name and a button go there.
```

## Prompt 2: cover background, desktop

File: **`cover-bg-desktop.png`** · Aspect ratio **16:9** (landscape)

```
Image 2 of the set, same style. Landscape 16:9, full-bleed, fully painted.
Composition: a wide gebyok screen — carved pillars and carved panels on the LEFT and RIGHT, each about 20% of the width, with ronce melati hanging from the top corners and kembar mayang standing at the bottom corners. The CENTRE 56% of the width, top to bottom, is calm empty ivory parchment for text. No flowers or garlands in the centre.
```

## Prompt 3: hero background (cut into two bands)

File: **`hero.png`** · Aspect ratio **9:16** (portrait)

```
Image 3 of the set, same style. Portrait 9:16, fully painted.
TOP BAND (top 30% only): a carved gebyok lintel across the top edge, with ronce melati garlands hanging below it in three soft loops and a few kantil flowers tied in. Everything in this band must end by 30% of the height — garland ends included.
BOTTOM BAND (bottom 24% only): kembar mayang and janur standing in both bottom corners, joined by a low drift of kembang setaman (melati, red mawar petals, kantil, kenanga) along the bottom edge. Nothing rises above 76% of the height.
MIDDLE (from 30% to 76%): completely empty ivory parchment, full width — a framed photo and the couple's names will be placed there.
```

## Prompt 4: oval frame for photos

File: **`photo-ring.png`** · Aspect ratio **4:5** (portrait)

```
Image 4 of the set, same style. Portrait 4:5.
Paint an elegant OVAL frame made of ronce melati: two or three parallel strings of jasmine buds following the oval, with small clusters of kantil and a single red mawar at the bottom centre and the top centre, and a thin antique-gold carved inner rim. The oval's outer edge is about 90% of the image width; its opening is about 74% of the width and 72% of the height, centred.
The inside of the oval and everything outside it must be completely flat, uniform, plain teal #1E8C8C — no texture, no shadow, no gradient — so I can cut the frame out cleanly. The couple's photo will appear inside the oval.
```

## Prompt 5: corner ornament

File: **`corner-tl.png`** · Aspect ratio **1:1** (square)

```
Image 5 of the set, same style. Square 1:1.
Paint ONE corner piece anchored in the TOP-LEFT corner: a carved teak gebyok corner bracket with floral relief and gold highlights, with two ronce melati strings hanging from it in loops and a small kantil cluster. It fills about the top-left 55% of the square and thins out toward the centre.
The background everywhere else must be completely flat, uniform, plain teal #1E8C8C — no texture, no shadow — so I can cut it out cleanly. Nothing touches the bottom or right edge.
```

## Prompt 6: kembang setaman sprites

File: **`petals-sheet.png`** · Aspect ratio **1:1** (square)

```
Image 6 of the set, same style. Square 1:1.
Paint 6 separate single elements arranged in a neat 3×2 grid with generous empty space between them (nothing overlapping, nothing touching): 1) an open white melati flower seen from above, 2) a closed melati bud, 3) a single cream kantil petal, 4) a single deep red mawar petal, 5) a pale yellow-green kenanga flower, 6) a small curled strip of young janur leaf.
Each element should be about 65% of its grid cell, evenly lit with soft shading, solid (no transparency effects), each tilted at a different angle.
Background: completely flat, uniform, plain teal #1E8C8C — no texture, no shadows on the background.
```

## Prompt 7: page texture

File: **`texture.png`** · Aspect ratio **1:1** (square)

```
Image 7 of the set. Square 1:1.
A close-up, seamless, tileable texture of warm ivory handmade paper (like daluang bark paper) in #F3E9D8, with soft fibres and very subtle mottling. No pattern, no objects, no vignette, no lighting gradient — evenly lit from edge to edge so it can repeat without visible seams.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters, aksara Jawa or watermark anywhere.
- [ ] Prompts 1, 2, 3: the empty zones really are empty, with no garland ends hanging into them.
- [ ] Prompts 4, 5, 6: the background is one flat **teal**, with no texture or shadow behind the art.
- [ ] All seven look like one set: same paint style, same browns and golds, same flowers.
- [ ] Downloaded at the largest size Gemini offers.
