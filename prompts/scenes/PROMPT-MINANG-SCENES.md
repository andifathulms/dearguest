# Scene art prompts: Gonjong Songket (`minang`)

**What these are for.** Five new images that give the page a second painting and things that move. After
the hero, the page is black lacquer with text and cards until the closing; these fill that stretch.

| Piece | File | Where it goes |
|---|---|---|
| C1 scene | `scene-interlude` | behind the countdown: a rumah gadang in the highlands, painted like a lacquer panel, with the numbers in its calm centre |
| C2a bride's attire | `attire-bride` | the suntiang on a stand. Stands in for the bride's portrait when the couple shows no photos |
| C2b groom's attire | `attire-groom` | the saluak on a stand, used the same way for the groom |
| C3 props | `prop-1` … `prop-4` | four separate objects, one beside the heading of each of the events, story, gift and RSVP sections, moving with the scroll |
| C4 evening closing | `closing-scene` | the cover's scene again, lit by lamps, behind the closing |

**How to use**
1. Open **one** new Gemini chat. Attach the reference painting **`design/packs/minang/masters/cover-bg-portrait.jpg`**,
   then paste **Prompt 0** with it.
2. Paste Prompts C1–C4 one at a time, choosing the aspect ratio each one names. C2 is two images.
3. If one is off, correct it in the same chat instead of starting a new chat.
4. File names don't matter. Drop everything into the repo's `assets/` folder and tell me "scene art for Gonjong Songket".

**Cut-outs (C2, C3) use flat cobalt blue #2340C8**, the same key colour as this theme's other cut-outs. Keep it
flat right to every edge: Gemini tends to add a haze or a floor along the bottom. That breaks the cut-out.
**C1 and C4 are full paintings on the theme's black lacquer**, with no cobalt anywhere.

---

## Prompt 0: style brief (paste first, once, with the reference image)

```
I'm adding new pieces to an existing set of illustrations for a digital wedding invitation theme called "Gonjong Songket". The attached image is from that set: match its style, palette, paper and brushwork exactly. Every image I ask for in this chat must share ONE consistent style. Remember this brief and apply it to every image:

STYLE
- Hand-painted illustration, gouache with fine gold-leaf detail, rich and ceremonial like a printed invitation for a baralek in Bukittinggi or Padang. Crisp carved ornament, soft painterly shading on fabric. Grand but orderly, not cluttered.
- NOT photographic, NOT 3D render, NOT vector, NOT cartoon.

PALETTE
- Background: deep black lacquer, base colour #17110F, with a very subtle warm sheen.
- Red: deep Minang red (#9B1C1C) for carving panels and songket.
- Gold: warm burnished gold (#C9A24A) with lighter highlights (#E6C77A).
- Accents: brass carano, green sirih leaves, white melati.
- No blue anywhere.

MINANG ELEMENTS (use where each prompt says)
- Gonjong: the soaring, curved, horn-like roof peaks of the rumah gadang, finished in gold.
- Ukiran: carved wooden relief in red, black and gold — kaluak paku (fern-tip spirals), pucuak rabuang (bamboo-shoot triangles), itiak pulang patang (rows of ducks, as a border only).
- Songket: red silk woven with dense gold geometric motifs.
- Langik-langik: the layered, draped fabric canopy above a Minang pelaminan, in red, gold and black, with gold fringe.
- Carano: a footed brass tray with a domed lid, holding sirih leaves and pinang.

ALWAYS
- No text, no letters, no numbers, no logos, no signatures, no watermarks.
- No people, no religious symbols.
- Leave large calm areas exactly where I say — invitation text will be placed there by the website.

Reply "Ready" and wait for my first image request.
```

---

## Prompt C1: the scene

File: **`scene-interlude`** · Aspect ratio **3:4** (portrait) · a full painting, no cobalt

```
Image C1 of the set, same style as the attached painting. Portrait 3:4. This is a full painting on the black lacquer background #17110F, like a gold-and-red lacquer panel. No cobalt blue anywhere.
BOTTOM 36% of the height: a rumah gadang seen from the front and slightly below, its row of gold gonjong roof peaks rising against the black, its front wall in red-and-gold carved panels, with two small rangkiang (rice barns with their own gonjong roofs) beside it, coconut palms, terraced rice fields in front and the outline of soft hills behind. Painted in burnished gold line and red on the black lacquer, with a few warm lamp glows in the windows.
TOP 16% of the height: one slim carved lintel of red-and-gold kaluak paku spirals running across, with a short gold fringe.
CENTRE, from 20% to 60% of the height and the full width: completely calm, plain black lacquer #17110F — nothing there at all. Numbers will be placed there by the website.
The top 4% and the bottom 5% of the image are plain black lacquer #17110F too, and the art fades softly into them, so the picture can sit on a page of the same colour with no visible edge. The left and right edges also fade to plain black lacquer in their outer 5%.
```

## Prompt C2: the attire, two images

Files: **`attire-bride`** and **`attire-groom`** · Aspect ratio **1:1** (square), one image each · cut-outs on cobalt

```
Image C2a of the set, same style. Square 1:1.
Paint ONE object, centred: a suntiang gadang, the Minang bride's tiered gold crown, shown on its own as an heirloom. Rows of fine gold flowers and leaves fan out in a wide half-circle, with small dangling gold ornaments at both sides. It rests on a low carved wooden stand wrapped in red-and-gold songket. There is NO head, NO face, NO mannequin and NO person: only the crown and its stand. The whole object fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges.
Everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze, no cast shadow under the stand.
```

```
Image C2b of the set, same style. Square 1:1. Same size, same angle and same kind of stand as the previous image, so the two make a pair.
Paint ONE object, centred: a saluak, the Minang groom's folded headcloth, in black-and-gold cloth with its layered folds at the front, resting on a low carved wooden stand wrapped in red-and-gold songket, with a folded red-and-gold songket sash laid at its foot. There is NO head, NO face, NO mannequin and NO person: only the headcloth, the sash and the stand. The whole object fits inside the middle 80% of the width and between 8% and 90% of the height. Crisp edges.
Everything around it must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. The bottom of the image is plain cobalt blue too: no ground, no floor, no haze, no cast shadow under the stand.
```

## Prompt C3: the props sheet

File: **`props-sheet`** (cut into `prop-1` … `prop-4`) · Aspect ratio **1:1** (square) · cut-outs on cobalt

```
Image C3 of the set, same style. Square 1:1.
Paint FOUR separate objects, one in each quarter of the image, arranged as a 2 × 2 grid. Each object sits in the middle of its own quarter and fills about 70% of it. There is a wide band of empty cobalt blue between the objects: none of them touches or overlaps another, and none touches the edge of the image.
TOP-LEFT: a brass carano, a footed tray with a domed lid, with green sirih leaves and a small red-and-gold embroidered cloth.
TOP-RIGHT: a ceremonial parasol, golden yellow with a long gold fringe and a carved gold finial, seen from the side and slightly tilted.
BOTTOM-LEFT: a marawa, the Minang pennant, with three vertical bands of black, red and golden yellow, hanging from a short slanted pole and rippling a little.
BOTTOM-RIGHT: a talempong, a small bronze kettle gong, resting on a red-and-gold songket cushion.
The background everywhere must be completely flat, uniform, plain cobalt blue #2340C8 — one even colour edge to edge, no texture, no shadow, no gradient, no mist, no blur. This includes the lower third of the image: the two bottom objects float on plain cobalt blue exactly like the two top ones, with no ground, no floor, no table, no haze and no cast shadows beneath them.
Check the lower third once more before finishing: it must be the same flat cobalt blue #2340C8 as the top.
```

## Prompt C4: the evening closing

File: **`closing-scene`** · Aspect ratio **9:16** (portrait) · a full painting, no cobalt

```
Image C4 of the set, same style. Portrait 9:16. This is a full painting on the black lacquer background #17110F. No cobalt blue anywhere.
Paint the SAME scene as the attached cover painting, with the same composition, but late in the evening and lit by lamps. At the top, the gonjong roofline and the langik-langik swag catch a warm glow from below. At the foot, the carano on its songket runner stands between two lit brass oil lamps with small steady flames, and their light falls warmly on the gold and the red cloth. A few tiny gold sparks drift upward near the lamps. The gold is brighter where the lamplight touches it and the corners fall into deeper shadow.
The art stays in the TOP 24% and the BOTTOM 26% of the height.
CENTRE, from 26% to 72% of the height and across the middle 80% of the width: completely calm, plain black lacquer #17110F — nothing there at all. The couple's initials and a closing message will be placed there by the website.
```

---

## Checklist before you drop them into `assets/`

- [ ] No text, letters or watermark anywhere; no people, no head or mannequin under the suntiang or the saluak.
- [ ] C1 and C4: no cobalt at all; the centre is plain black lacquer; C1's edges fade to plain black.
- [ ] C2 and C3: one flat, even **cobalt blue** right to every edge, with no floor, haze or shadow, including the lower third of the props sheet.
- [ ] C2: the two images match in size and angle. C3: four objects, well apart.
- [ ] All look like the theme's existing paintings: same lacquer, same colours, same brushwork.

**For a reviewer from the Minang community.** These were chosen by someone outside the culture, so please check each one before it ships:
- Is it respectful to show a suntiang and a saluak as objects on stands, and are these the right pair for a bride and groom? The pack's own rule so far is "no suntiang worn by a figure".
- Should the suntiang follow a particular regional form (Padang, Pariaman, Solok), or stay general?
- Do the carano, the yellow parasol, the marawa and the talempong belong at a baralek, and may they be used as decoration that floats beside invitation text? Is a yellow parasol reserved for anyone?
- Are the marawa's colours and their order right?
- Does a rumah gadang with rangkiang suit families from both the darek and the rantau?
