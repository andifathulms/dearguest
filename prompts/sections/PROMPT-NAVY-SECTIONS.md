# Section art prompts: Mawar Malam (`navy`)

**What these are for.** Four new pieces that give the invitation's sections depth, so the page is no longer flat
paper between the cover and the closing. They are painted in the same style as the theme's existing art.

| Piece | File | Where it goes |
|---|---|---|
| S1 side spray | `section-edge` | grows in from the side edges of the sections (left, then mirrored on the right, alternating), behind the cards, and moves at its own speed as you scroll; large on desktop, where the sides are empty |
| S2 garland | `section-garland` | the painted divider between sections, in place of the thin drawn line |
| S3 wreath | `monogram-wreath` | around the couple's initials ("A & B") at the closing and between the two profiles |
| S4 card corner | `card-corner` | on the corners of the event cards, the gift cards and the RSVP form (top-left, mirrored at the bottom-right) |

**How to use**
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/navy/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts S1–S4 one at a time, choosing the aspect ratio each one names.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "section art for Mawar Malam".

**Cut-outs use flat magenta #D01C8B**, the same key colour as this theme's other cut-outs. Keep it flat right to every edge:
Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Mawar Malam". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted gouache and watercolour botanical illustration on deep navy paper, like a luxurious dark-ground printed invitation. Luminous white petals with soft blue-grey shading, delicate fine-line stems, a hush of moonlight. Generous dark empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon, NOT neon.

PALETTE
- Background paper: deep navy, base colour #14213D, with a very faint paper grain.
- Flowers (the main element): white garden roses, peonies and ranunculus (#F6F4EF) shaded with cool blue-grey (#BFC8D6), creamy centres (#EDE3CC); tiny white baby's breath.
- Leaves: dusty-blue eucalyptus (#7F97AC), silver-green leaves (#A4B3A6), a few deeper blue-green leaves (#3E5866).
- Gold: very fine burnished gold lines (#C8A75E) on a few leaf veins and stems only.
- No pink, no magenta, no red anywhere.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks, no frames or borders around the image.
- No people, no animals, no buildings, no vases, no moon or stars drawn as objects, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style as the attached painting. Portrait 9:16.
Paint ONE tall spray anchored to the LEFT edge of the image: white garden roses, peonies and ranunculus with dusty-blue eucalyptus and baby's breath, a few fine gold lines on the stems. It comes in from the left edge and is cut by it. The art stays in the LEFT 45% of the width and between 8% and 92% of the height, fullest around the middle, with fine tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 55% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain magenta too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: white roses and ranunculus with eucalyptus and baby's breath, tapering to eucalyptus tips at both ends. It runs from about 6% to 94% of the width, fullest in the middle and tapering to fine tips at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: a fine gold ring wound with eucalyptus and silver-green leaves, with small white roses and baby's breath, fuller at the bottom. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a small spray of baby's breath with one white ranunculus and a eucalyptus leaf. It runs along the top edge and down the left edge like an L, each arm reaching about 40% of the side, densest in the corner itself. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain magenta #D01C8B — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people.
- [ ] Every background is one flat, even **magenta** right to every edge, with no floor, haze or blurred patch.
- [ ] S1: the spray stays in the left half; S2: thin and centred; S3: the circle in the middle is empty; S4: top-left corner only.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer:** No regional elements. Check that the magenta key leaves no pink in the white petals.
