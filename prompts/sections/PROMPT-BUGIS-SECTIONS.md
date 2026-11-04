# Section art prompts: Lamming Zamrud (`bugis`)

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
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/bugis/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts S1–S4 one at a time, choosing the aspect ratio each one names. S5 and S6 are optional.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "section art for Lamming Zamrud".

**Cut-outs use flat cobalt blue #2340C8**, the same key colour as this theme's other cut-outs. Keep it flat right to every edge:
Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Lamming Zamrud". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted illustration, gouache with fine gold-leaf detail, rich and ceremonial like a printed invitation from a noble family in Bone, Wajo or Gowa. Crisp carved-gold ornament, soft painterly shading on silk and leaves. Luxurious but orderly, not cluttered.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: deep emerald silk, base colour #0F3B2E, with a very subtle woven-silk sheen and darker edges (#0A2A21).
- Gold: warm burnished gold (#C9A24A) with lighter highlights (#E6C77A) for carving and borders.
- Silk (sabbe): deep red (#9E1B2C) and emerald with fine gold threads, in small woven checks ("balo renni" style).
- Accents: red-and-gold bosara lids, cream candles, white melati, yellow cempaka, green daun pacar (henna leaves).
- No blue anywhere.

BUGIS ELEMENTS (use where each prompt says)
- Lamming: the ornate gold-carved wedding dais backdrop with layered timpa laja gables at the top.
- Bunga parenreng: the flowing Bugis-Makassar vine-and-leaf carving motif, in gold.
- Walasuji: a woven split-bamboo lattice with a square diamond (sulapa eppa) pattern.
- Bosara: footed dishes with conical red lids trimmed in gold, often in a row.
- Mappacci items: daun pacar on a silver tray, pesse pelleng (small candles), beras kuning (yellow rice).

ALWAYS
- No text, no letters, no numbers, no Lontara script, no logos, no signatures, no watermarks.
- No people, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt S1: side spray

File: **`section-edge`** · Aspect ratio **9:16** (portrait)

```
Image S1 of the set, same style as the attached painting. Portrait 9:16.
Paint ONE tall spray anchored to the LEFT edge of the image: a strip of gold-carved bunga parenreng vine carving along the left edge, with a draped red-and-gold sabbe silk and sprays of white melati and green daun pacar. It comes in from the left edge and is cut by it. The art stays in the LEFT 45% of the width and between 8% and 92% of the height, fullest around the middle, with fine tips reaching to the right and thinning out. Crisp edges.
Everything else — the right 55% of the width, the top 8% and the bottom 8% — must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze.
```

## Prompt S2: garland divider

File: **`section-garland`** · Aspect ratio **16:9** (landscape)

```
Image S2 of the set, same style. Landscape 16:9.
Paint ONE long, slender horizontal garland lying across the CENTRE of the image: a gold-carved bunga parenreng vine, with small white melati and yellow cempaka at the centre. It runs from about 6% to 94% of the width, fullest in the middle and tapering to fine tips at both ends, roughly symmetrical, and stays between 38% and 62% of the height. Crisp edges.
The background above, below and around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S3: wreath for the couple's initials

File: **`monogram-wreath`** · Aspect ratio **1:1** (square)

```
Image S3 of the set, same style. Square 1:1.
Paint ONE perfectly round wreath, centred: a ring of gold-carved bunga parenreng vine and leaves, with white melati and yellow cempaka, and a small band of walasuji diamond lattice at the bottom. Its outer edge is about 90% of the image width. The opening in the middle is a clean circle about 56% of the width, completely empty — two initials will be set there in type. Fuller at the bottom, lighter at the top, and nothing reaching into the opening. Crisp edges.
The inside of the wreath and everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S4: card corner

File: **`card-corner`** · Aspect ratio **1:1** (square)

```
Image S4 of the set, same style. Square 1:1.
Paint ONE small, delicate corner ornament anchored in the TOP-LEFT corner: a small gold-carved bunga parenreng corner with one melati bud. It runs along the top edge and down the left edge like an L, each arm reaching about 40% of the side, densest in the corner itself. Nothing beyond 45% of the width or of the height. It will sit on the corner of a text card, so keep it light.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

## Prompt S5 and S6: depth layers (optional, two images)

Files: **`parallax-back`** and **`parallax-front`** · Aspect ratio **9:16** (portrait), one image each

```
Image S5 of the set, same style. Portrait 9:16. A FAR layer for depth: pale Bugis stilt houses (bola) with their crossed gable ends among coconut palms, paler and dimmer than everything else in the set, filling the BOTTOM 30% of the image. They run off the bottom edge of the image: there is NO cobalt blue below them, and the image's bottom edge cuts through them. Their top edge is a clear outline against the background, not mist fading into it.
Everything above, from the top edge down to 70% of the height, must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

```
Image S6 of the set, same style. Portrait 9:16. A NEAR layer for depth: red-and-gold sabbe silk drapes with gold fringe, very close to the viewer and slightly soft, hanging ONLY from the TOP edge at the LEFT and RIGHT, cropped by the sides, each reaching no more than 18% of the width into the picture and ending above 50% of the height. Nothing else anywhere in the image.
Everything else must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people.
- [ ] Every background is one flat, even **cobalt blue** right to every edge, with no floor, haze or blurred patch.
- [ ] S1: the spray stays in the left half; S2: thin and centred; S3: the circle in the middle is empty; S4: top-left corner only.
- [ ] All look like the theme's existing paintings: same paper, same colours, same brushwork.

**For a reviewer:** No Lontara script anywhere. Do the gold vine and walasuji read as Bugis-Makassar rather than generic Malay?
