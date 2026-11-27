# Scene art prompts

Section art (`prompts/sections/`) gave the sections ornaments: a spray, a garland, a wreath, a corner.
Scene art gives the page **a second painting and things that move**. After the hero, every pack is
two or three screens of flat colour with text and cards; these pieces fill that stretch.

| Piece | Slot | On the page |
|---|---|---|
| C1 scene (3:4, full painting) | `scene-interlude` | behind the countdown: a painted view with a calm centre for the numbers |
| C2a, C2b attire (1:1, cut-outs) | `attire-bride`, `attire-groom` | the bride's and groom's headpieces as objects, no people. They stand in for the portraits when a couple shows no photos, and sit small beside the names when they do |
| C3 props (1:1, sheet of four cut-outs) | `prop-1` … `prop-4` | separate objects that drift in from the sides of the events, story, gift and RSVP sections on scroll, each at its own speed |
| C4 evening closing (9:16, full painting) | `closing-scene` | the cover's scene again at night with the lamps lit, behind the closing: the page ends in the evening |

Every file repeats its theme's style brief (Prompt 0) word for word and asks you to attach the theme's
own cover painting.

**Status.** Pilot on two packs, one dark and one light: Gonjong Songket (`minang`) and Gebyok Sogan
(`javanese`). The shared rendering for these slots does not exist yet. The first theme whose art
arrives builds it (`docs/theme-packs.md` §4, §9), and a pack without these slots must render exactly
as it does today. Write the other themes' files only after the owner has approved the pilot on screen.

**New themes** get these prompts inside their own `PROMPT-<THEME>-ASSETS.md` from the start (see
CLAUDE.md, "Give me another prompt"), so every new pack ships with the full set.

**Rules that differ from the section art**
- C1 and C4 are full paintings, not cut-outs. Their top and bottom edges fade into the theme's plain
  background colour so they blend into the page.
- C4 is darker than the page on a light theme. The closing's text then needs light ink over it.
- C2 and C3 show ceremonial objects. Each file ends with questions for a reviewer from that culture;
  get the answers before the pack ships.
- Still no people, no text, no religious symbols.

**Order.** One theme at a time: drop its images into `assets/`, then say "scene art for <theme name>".
