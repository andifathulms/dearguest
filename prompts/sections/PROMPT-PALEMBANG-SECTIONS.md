# Section art prompts: Limas Emas (`palembang`)

**What these are for.** Four new pieces that give the invitation's sections depth, so the page is no longer flat
paper between the cover and the closing. They are painted in the same style as the theme's existing art.

| Piece | File | Where it goes |
|---|---|---|
| S1 side spray | `section-edge` | grows in from the side edges of the sections (left, then mirrored on the right, alternating), behind the cards, and moves at its own speed as you scroll; large on desktop, where the sides are empty |
| S2 garland | `section-garland` | the painted divider between sections, in place of the thin drawn line |
| S3 wreath | `monogram-wreath` | around the couple's initials ("A & B") at the closing and between the two profiles |
| S4 card corner | `card-corner` | on the corners of the event cards, the gift cards and the RSVP form (top-left, mirrored at the bottom-right) |

**How to use**
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/palembang/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts S1–S4 one at a time, choosing the aspect ratio each one names.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "section art for Limas Emas".

**Cut-outs use flat cobalt blue #2340C8**, the same key colour as this theme's other cut-outs. Keep it flat right to every edge:
Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Limas Emas". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

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

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style as the attached painting. Portrait 9:16.
Paint ONE tall spray anchored to the LEFT edge of the image: a narrow carved and gilded rumah limas panel along the left edge with gold lak florals, a draped red-and-gold songket limar with its gold fringe, and cempaka. It comes in from the left edge and is cut by it. The art stays in the LEFT 45% of the width and between 8% and 92% of the height, fullest around the middle, with fine tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 55% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: gold lak florals and tendrils (Palembang lacquer ornament), with ivory cempaka and jasmine at the centre. It runs from about 6% to 94% of the width, fullest in the middle and tapering to fine tips at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: a carved gilded ring of gold lak florals and tendrils, with cempaka at the top and a short folded songket limar with its gold fringe at the bottom. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a small gilded lak floral corner with one cempaka bud. It runs along the top edge and down the left edge like an L, each arm reaching about 40% of the side, densest in the corner itself. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people.
- [ ] Every background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch.
- [ ] S1: the spray stays in the left half; S2: thin and centred; S3: the circle in the middle is empty; S4: top-left corner only.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer:** No crowns or headdresses (aesan gede, paksangko). The songket is only draped or folded.
