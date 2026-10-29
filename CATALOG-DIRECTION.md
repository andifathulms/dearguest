# Theme catalogue: direction

Every theme is a **painted pack**: real illustrated art (generated with Gemini from a `PROMPT-*-ASSETS.md`, built by `scripts/build_pack_art.py`), not CSS colour swaps. The 36 old image-less themes and Minimal were removed in October 2026. Invitations on them moved to the closest pack (migration `0040`).

## Naming

- **Theme names describe the look, not the ethnic group:** a signature object plus a material or colour. For example *Gebyok Sogan*, *Gonjong Songket*, *Lamming Zamrud*, *Merah Anggur*, *Taman Sage*. The cultural origin goes in the description and the reviewer notes, never in the name.
- **Internal ids stay short and technical** (`javanese`, `minang`, `bugis`, `sunda`, `batak`, `floral`, `sage`, `rustic`, `lavender`, `bali`). Customers never see them.
- **Two words** where possible, Indonesian, easy to say out loud and to search for.

## Categories

| Category | Promise | Live | Next candidates |
|---|---|---|---|
| **Pesona Nusantara** | regional wedding heritage, shown with respect | Gebyok Sogan (Jawa), Gonjong Songket (Minang), Lamming Zamrud (Bugis), Siger Mega Mendung (Sunda), Gorga Ulos (Batak Toba), Jepun Prada (Bali) | Palembang (songket limar, gold); Betawi (ondel-ondel motifs, *kembang kelapa*); Melayu (tepak sirih, yellow and gold); Dayak; Toraja |
| **Taman & Bunga** | botanical and painterly, suits any background | Merah Anggur (dark wine florals), Taman Sage (fresh watercolour), Pampas Kraft (kraft paper, pampas, dried flowers), Wisteria Lila (lilac wisteria, pastel) | **Mawar Malam (Navy Bloom: white blooms on deep navy), prompt ready**; Tropis (monstera, frangipani) |
| *(later)* **Modern & Minimalis** | clean, editorial, photo-led | none yet | a painted-minimal pack: line-art florals or an arch, so it still has assets |

**Suggested order.** Navy Bloom next (Sunda, Rustic, Batak, Lavender and Bali are live), then one *Taman & Bunga* look per *Nusantara* look, so the catalogue stays balanced between couples who want heritage and couples who don't:
1. Sunda (live)
2. Rustic (live)
3. Batak (live)
4. Lavender (live)
5. Bali (live)
6. Navy Bloom (prompt ready: `PROMPT-NAVY-ASSETS.md`)
7. Palembang

## Per-theme checklist (what worked)

1. **Prompt:**
   - a style brief, then 7 images;
   - exact empty zones for text;
   - a separate hero painting with art only in the top and bottom bands;
   - cut-outs on one flat key colour that appears nowhere in the palette (cobalt by default, magenta if the palette has blue);
   - the texture is optional, because Gemini often refuses plain surfaces and the build can generate one;
   - an optional Prompt 8 for depth layers (`parallax-back` / `parallax-front` cut-outs), which move with the hero's scroll at no code cost;
   - a suggested `motion` for the pack (exit + signature), chosen from the composition.
2. **Assets** go into `assets/` (git-ignored). File names don't matter.
3. **Build:**
   - move the images to `design/packs/<id>/masters/` and rename them by content;
   - measure the empty zones and the photo-frame opening, and add a recipe;
   - run `python3 scripts/build_pack_art.py <id>`;
   - check the cut-outs over a light and a dark background;
   - on a magenta key, use `'despill': 'magenta'` (edges only, so the art's own pinks survive). If part of the sprite sheet isn't flat, cut it off with `sprites_crop`.
   - feathery art (pampas, fringe) with a dark outline over a light background: `'edge_fill': True`. A blurred patch in a cut-out's key: `'clear'`. A painted texture that doesn't match the paintings' paper: `'texture_tint'`.
   - a Prompt 8 far layer that came as a strip with mist fading into the key: build it as a band (`'both'` fades both edges) and place it with the pack's CSS. Depth offsets are in screen heights, so a thin strip moves as much as a full-frame layer.
   - check every face at phone size before baselines: hairline and high-contrast faces (Bodoni, Italiana) break up at 1x ("H" reads as "II"). Use a small optical size, or a sturdier face for titles and labels.
   - an orange key (lilac palettes): no despill; `edge_fill` fades strokes leaning towards the key's hue.
4. **Pack:**
   - `theme.json` (`painted` cover, `framed` hero, and a `motion` block: `make check` fails without it). Choose them from `docs/theme-packs.md` §9:
     - `exit` from how the cover is composed: doors, curtain, gate, part or bloom;
     - one or two `signature` loops that fit the art: drift, sway, shimmer or breathe;
   - tokens sampled from the paintings;
   - three OFL fonts not used by another pack;
   - ornaments drawn in code;
   - `overrides.css`, under 150 lines;
   - an `"og"` block for the link preview: the build writes `assets/og-template.jpg` (1200×630 from the desktop cover); set `box` to its calm area, `ink`/`accent` from the tokens, `shadow: true` for light text on dark art, and the three font roles. Check the result with `scripts/crawl_check.py`, or by rendering a long name pair.
5. **Registry:** a commercial name, a category, and a demo slug named after the theme. Then `make themes` and `seed_demos`.
6. **Tests:**
   - a `packs/<id>.spec.js` copied from another pack's spec;
   - write the baselines with `<spec> --update-snapshots=missing`;
   - verify twice with the machine idle.
7. **Review:** cultural notes in the pack's `DESIGN.md` for a reviewer from that region.
