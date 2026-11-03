# Section art prompts: Gebyok Sogan (`javanese`)

**What these are for.** Four new pieces that give the invitation's sections depth, so the page is no longer flat
paper between the cover and the closing. They are painted in the same style as the theme's existing art.

| Piece | File | Where it goes |
|---|---|---|
| S1 side spray | `section-edge` | grows in from the side edges of the sections (left, then mirrored on the right, alternating), behind the cards, and moves at its own speed as you scroll; large on desktop, where the sides are empty |
| S2 garland | `section-garland` | the painted divider between sections, in place of the thin drawn line |
| S3 wreath | `monogram-wreath` | around the couple's initials ("A & B") at the closing and between the two profiles |
| S4 card corner | `card-corner` | on the corners of the event cards, the gift cards and the RSVP form (top-left, mirrored at the bottom-right) |
| S5, S6 depth layers (optional) | `parallax-back`, `parallax-front` | the hero on phones: a far layer that trails the scroll and a near layer that moves ahead of it (this theme has none yet) |

**How to use**
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/javanese/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts S1–S4 one at a time, choosing the aspect ratio each one names. S5 and S6 are optional.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "section art for Gebyok Sogan".

**Cut-outs use flat teal #1E8C8C**, the same key colour as this theme's other cut-outs. Keep it flat right to every edge:
Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Gebyok Sogan". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

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

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style as the attached painting. Portrait 9:16.
Paint ONE tall spray anchored to the LEFT edge of the image: long strings of ronce melati (jasmine buds) hanging in loops from a small carved teak bracket at the left edge, with a kantil flower, kenanga and one red rose. It comes in from the left edge and is cut by it. The art stays in the LEFT 45% of the width and between 8% and 92% of the height, fullest around the middle, with fine tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 55% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain teal too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: a swag of ronce melati strings in shallow loops, with kantil and kenanga gathered at the centre. It runs from about 6% to 94% of the width, fullest in the middle and tapering to fine tips at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: a ring of jasmine bud strings wound with kantil, pale green kenanga and two small red roses, with fine antique-gold accents. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a small carved teak corner with sogan-brown and gold floral relief and a sprig of melati. It runs along the top edge and down the left edge like an L, each arm reaching about 40% of the side, densest in the corner itself. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S5 and S6: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image S5 of the set, same style. Portrait 9:16. A FAR layer for depth: a pale silhouette of a joglo pendopo roof among trees and coconut palms, washed out like distant morning haze, paler and dimmer than everything else in the set, filling the BOTTOM 30% of the image. They run off the bottom edge of the image: there is NO teal below them, and the image's bottom edge cuts through them. Their top edge is a clear outline against the background, not mist fading into it.
Everything above, from the top edge down to 70% of the height, must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

```
Image S6 of the set, same style. Portrait 9:16. A NEAR layer for depth: long ronce melati strings and the ends of a carved teak gebyok frame, very close to the viewer and slightly soft, hanging ONLY from the TOP edge at the LEFT and RIGHT, cropped by the sides, each reaching no more than 18% of the width into the picture and ending above 50% of the height. Nothing else anywhere in the image.
Everything else must be completely flat, uniform, plain teal #1E8C8C — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people.
- [ ] Every background is one flat, even **teal** right to every edge, with no floor, haze or blurred patch.
- [ ] S1: the spray stays in the left half; S2: thin and centred; S3: the circle in the middle is empty; S4: top-left corner only.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer:** No aksara Jawa, wayang or religious symbols. Does a joglo roof in the distance suit families from Solo and Yogyakarta?
