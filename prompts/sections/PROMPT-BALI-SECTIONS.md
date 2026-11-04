# Section art prompts: Jepun Prada (`bali`)

**What these are for.** Four new pieces that give the invitation's sections depth, so the page is no longer flat
paper between the cover and the closing. They are painted in the same style as the theme's existing art.

| Piece | File | Where it goes |
|---|---|---|
| S1 side spray | `section-edge` | grows in from the side edges of the sections (left, then mirrored on the right, alternating), behind the cards, and moves at its own speed as you scroll; large on desktop, where the sides are empty |
| S2 garland | `section-garland` | the painted divider between sections, in place of the thin drawn line |
| S3 wreath | `monogram-wreath` | around the couple's initials ("A & B") at the closing and between the two profiles |
| S4 card corner | `card-corner` | on the corners of the event cards, the gift cards and the RSVP form (top-left, mirrored at the bottom-right) |

**How to use**
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/bali/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts S1–S4 one at a time, choosing the aspect ratio each one names.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "section art for Jepun Prada".

**Cut-outs use flat cobalt blue #2340C8**, the same key colour as this theme's other cut-outs. Keep it flat right to every edge:
Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Jepun Prada". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

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

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style as the attached painting. Portrait 9:16.
Paint ONE tall spray anchored to the LEFT edge of the image: white-and-yellow jepun (frangipani) blossoms and deep green leaves, with a strip of plaited janur and a short swag of red prada cloth with gold-leaf florals. It comes in from the left edge and is cut by it. The art stays in the LEFT 45% of the width and between 8% and 92% of the height, fullest around the middle, with fine tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 55% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: jepun blossoms and plaited janur leaves, with small touches of gold-leaf prada in the middle. It runs from about 6% to 94% of the width, fullest in the middle and tapering to fine tips at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: a ring of plaited janur wound with jepun blossoms and deep green leaves, with fine gold patra tendrils, fuller at the bottom. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a small carved paras-stone bracket with flowing patra punggel leaf carving and one jepun blossom. It runs along the top edge and down the left edge like an L, each arm reaching about 40% of the side, densest in the corner itself. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people.
- [ ] Every background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch.
- [ ] S1: the spray stays in the left half; S2: thin and centred; S3: the circle in the middle is empty; S4: top-left corner only.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer:** Check that nothing reads as an offering (canang sari), a penjor or a shrine: the janur here is only woven decoration.
