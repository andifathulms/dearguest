# Section art prompts: Gorga Ulos (`batak`)

**What these are for.** Four new pieces that give the invitation's sections depth, so the page is no longer flat
paper between the cover and the closing. They are painted in the same style as the theme's existing art.

| Piece | File | Where it goes |
|---|---|---|
| S1 side spray | `section-edge` | grows in from the side edges of the sections (left, then mirrored on the right, alternating), behind the cards, and moves at its own speed as you scroll; large on desktop, where the sides are empty |
| S2 garland | `section-garland` | the painted divider between sections, in place of the thin drawn line |
| S3 wreath | `monogram-wreath` | around the couple's initials ("A & B") at the closing and between the two profiles |
| S4 card corner | `card-corner` | on the corners of the event cards, the gift cards and the RSVP form (top-left, mirrored at the bottom-right) |

**How to use**
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/batak/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts S1–S4 one at a time, choosing the aspect ratio each one names.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "section art for Gorga Ulos".

**Cut-outs use flat cobalt blue #2340C8**, the same key colour as this theme's other cut-outs. Keep it flat right to every edge:
Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Gorga Ulos". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted gouache illustration on warm ivory paper, crisp and graphic like a carved-and-painted gorga panel, with soft painterly shading on the cloth and leaves. Bold, confident ornament; generous empty space.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: warm ivory paper, base colour #F4EDE1, with faint fibres.
- Gorga: the Batak three colours — deep red (#A3201B), black (#1A1412) and chalk white (#F7F3EA) — in carved spirals and interlocking curls, with thin black outlines.
- Ulos: Ragi Hotang style — maroon (#6E1A1E), black and white bands with fine gold-white thread (#E6D6A8) and a long knotted fringe.
- Wood: dark weathered timber (#3A2A22) for the house beams.
- Accents: deep green hariara fig leaves (#3F5B3A), pale woven pandan (#CDB98A), a few white jasmine.
- No blue anywhere except the lake and sky in the desktop landscape.

BATAK ELEMENTS (use where each prompt says)
- Gorga: carved ornament of curling spirals and interlocking vine-like curls (ipon-ipon borders, simeol-eol curls). Do NOT paint faces, singa heads, lizards, breasts, or the eight-pointed Desa Naualu star — ornament only.
- Rumah bolon: the traditional house's tall, saddle-backed roof sweeping up to points at both ends, its gable and front beam covered in gorga. Shown as architecture only, from outside.
- Ulos: folded or draped cloth with its knotted fringe — never worn by a person.
- Tandok: a woven pandan rice basket with a red-black-white band.
- Landscape (desktop only): Lake Toba with the soft hills of Samosir in morning haze.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks.
- No people, no animals, no weapons, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style as the attached painting. Portrait 9:16.
Paint ONE tall spray anchored to the LEFT edge of the image: a folded Ragi Hotang ulos hanging down from the left edge with its long knotted fringe, with deep green hariara fig leaves and a few white jasmine. It comes in from the left edge and is cut by it. The art stays in the LEFT 45% of the width and between 8% and 92% of the height, fullest around the middle, with fine tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 55% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: a folded ulos runner laid flat, its knotted fringe at both ends, with fig leaves and jasmine gathered at the centre. It runs from about 6% to 94% of the width, fullest in the middle and tapering to fine tips at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: a carved gorga ring of curling spirals and interlocking curls in deep red, black and chalk white, with a small rumah bolon roof point at the top and a folded ulos with its fringe at the bottom. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a small carved gorga bracket of curling spirals in red, black and white. It runs along the top edge and down the left edge like an L, each arm reaching about 40% of the side, densest in the corner itself. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people.
- [ ] Every background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch.
- [ ] S1: the spray stays in the left half; S2: thin and centred; S3: the circle in the middle is empty; S4: top-left corner only.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer:** The wreath and corners keep to spirals and curls: no faces, singa heads, lizards, breasts or the Desa Naualu star. The ulos is only folded or draped.
