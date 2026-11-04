# Section art prompts

One file per live theme. Each asks Gemini for four pieces that give the sections depth (the countdown, events,
story, gifts, RSVP, maps and closing are flat paper today):

| Piece | Slot | On the page |
|---|---|---|
| S1 side spray (9:16) | `section-edge` | grows in from the sides of the sections, behind the cards, mirrored and alternating left and right; moves at its own speed on scroll; large on desktop |
| S2 garland (16:9) | `section-garland` | the painted divider between sections |
| S3 wreath (1:1) | `monogram-wreath` | around the couple's initials at the closing and between the profiles |
| S4 card corner (1:1) | `card-corner` | on the corners of event and gift cards and the RSVP form |
| S5, S6 (optional) | `parallax-back`, `parallax-front` | hero depth layers, only for the seven themes that don't have them yet |

Every file repeats its theme's original style brief (Prompt 0 of `PROMPT-<ID>-ASSETS.md`) word for word.
It also asks you to attach that theme's own cover painting, so the new pieces match the old ones.

**Order.** Any order works. Do one theme at a time: drop its images into `assets/`, then say
"section art for <theme name>". The first theme to arrive also builds the shared rendering for these slots.
