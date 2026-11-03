# Section art prompts: Merah Anggur (`floral`)

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
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/floral/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts S1–S4 one at a time, choosing the aspect ratio each one names. S5 and S6 are optional.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "section art for Merah Anggur".

**Cut-outs use flat cobalt blue #2340C8**, the same key colour as this theme's other cut-outs. Keep it flat right to every edge:
Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Merah Anggur". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

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

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style as the attached painting. Portrait 9:16.
Paint ONE tall spray anchored to the LEFT edge of the image: wine-red and dusty-rose peonies, a cluster of white moth orchids (anggrek bulan), jasmine sprays and trailing amaranthus. It comes in from the left edge and is cut by it. The art stays in the LEFT 45% of the width and between 8% and 92% of the height, fullest around the middle, with fine tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 55% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: peonies, jasmine sprays and eucalyptus, with long trailing amaranthus tails at both ends. It runs from about 6% to 94% of the width, fullest in the middle and tapering to fine tips at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: small wine and dusty-rose peonies, jasmine buds and muted olive leaves, with a few fine antique-gold tendrils, fuller at the bottom. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a small spray of white jasmine buds with one dusty-rose bloom and an olive leaf. It runs along the top edge and down the left edge like an L, each arm reaching about 40% of the side, densest in the corner itself. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S5 and S6: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image S5 of the set, same style. Portrait 9:16. A FAR layer for depth: a soft, misty line of dark flowering shrubs and garden hedges, a little lighter than the wine background, paler and dimmer than everything else in the set, filling the BOTTOM 30% of the image. They run off the bottom edge of the image: there is NO cobalt blue below them, and the image's bottom edge cuts through them. Their top edge is a clear outline against the background, not mist fading into it.
Everything above, from the top edge down to 70% of the height, must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

```
Image S6 of the set, same style. Portrait 9:16. A NEAR layer for depth: large wine peonies with trailing amaranthus and willow-like greenery, very close to the viewer and slightly soft, hanging ONLY from the TOP edge at the LEFT and RIGHT, cropped by the sides, each reaching no more than 18% of the width into the picture and ending above 50% of the height. Nothing else anywhere in the image.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people.
- [ ] Every background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch.
- [ ] S1: the spray stays in the left half; S2: thin and centred; S3: the circle in the middle is empty; S4: top-left corner only.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer:** No regional elements. Note: the new pieces are painted on a key colour; the old ones were cut from the wine background, so check the reds match.
