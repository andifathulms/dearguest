# Strategy review: findings and work list

Written 25 November 2026 from a business and product review of the repo and the market. It is a
hand-off: a later session should be able to pick a task from §6 and do it without the original
conversation. The illustrated version (with the theme covers) is at
https://claude.ai/artifact/8StTfF2YPhJdFvYuKBUWGt (private to the owner).

**How to use this file.** §1–§5 are the findings and the reasoning. §6 is the work list, split into
tasks a session can do alone and decisions only the owner can make. Don't start an owner-decision
task on your own; ask first. Everything marked *recommendation* is judgement, not data: there is no
sales data yet.

## 1. Verdict

The feature list is level with the market leaders, so features will not set the product apart. The
edge is that every theme is a real painting of one region's wedding setting, and it moves. No
competitor was found leading with that (their adat themes were read from descriptions only; the
artwork was not viewed).

Three things stop the product selling today:
1. There is no payment flow (activation is a manual transfer plus a WhatsApp code).
2. The privacy policy and terms are not written.
3. The demos show Western stock couples inside Minang and Bugis frames.

## 2. Market facts

Sources are in §8. Prices are from vendor sites and vendor-run blogs on 25 Nov 2026.

- **Marriages (Kemenag):** 1.705.348 (2022), 1.577.255 (2023), 1.478.302 (2024), about 1,48 million (2025).
- **WhatsApp:** used by 90,8% of internet users aged 16+ (DataReportal, 2025).
- **Adoption:** 91% of couples in Bridestory's 2025 survey use digital invitations. The sample is
  urban and affluent, so the national figure is lower.
- **Price bands:** marketplace sellers Rp30.000–75.000 (often free with printed cards); budget SaaS
  Rp25.000–99.000; mid Rp100.000–300.000; premium Rp300.000–700.000; full custom Rp600.000 and up.

| Vendor | Price (Rp) | Model | Leads with |
|---|---|---|---|
| **DearGuest today** | 0 · 99.000 · 179.000 | Self-serve, manual activation | 13 painted themes, personal links, usher check-in, religion variants |
| Datengdong | 59.000 · 99.000 | Self-serve | 27 themes, 1 year active, WA blast and QR check-in on the top tier |
| Wekita | 82.000–210.000 | Done for you, under 24 hours | Unlimited revisions, 1 year active, 9 adat themes, "tanpa foto" variants |
| Satu Momen | 79.000–199.000 | Self-serve | Priced by active days (7 / 30 / 90); Jawa, Aceh, Batak themes |
| Sannubari | 99.000–499.000 | Full-service custom | Multi-language, heavy SEO publishing |
| Katsudoto | 300.000–700.000 | Self-serve or full service; 15% affiliate | Wedding-day suite: check-in, tables, souvenirs |
| Viding | from 150.000 (unverified) | Self-serve plus crew | ~167 themes, auto WA blast |

Katsudoto's pricing page looked stale and Satu Momen's prices came from search snippets; treat both
as approximate.

What this means:
- Rp99.000 is the most crowded price in the market, and the Premium plan sits exactly there.
- Competitors give 1 year of hosting; DearGuest gives 3 months after the wedding.
- Adat themes elsewhere are few and described as batik, wayang and ornament motifs. No digital
  themes were found for Bugis, Palembang or Sunda.
- Repeated complaints about competitors: hidden fees for extra guests or revisions, short active
  periods, designs that look alike, and guests who distrust links after the fake "undangan APK"
  malware of 2023 and 2025. First-hand customer reviews could not be reached (Shopee, TikTok,
  Instagram and Reddit were not searchable), so this list comes from vendor blogs and news.

## 3. What the product has that others don't

1. **Painted heritage.** Seven regions live (Jawa, Minang, Bugis, Sunda, Batak Toba, Bali,
   Palembang), each painting that region's wedding architecture.
2. **The opening moment.** The cover exit plus the hero curtain is a three-second clip suited to
   TikTok and Instagram.
3. **A link guests can trust.** The WhatsApp preview card carries the guest's own name from the
   guest list (DISTRIBUTION-REPORT.md §A). That answers the APK-scam fear. The landing page doesn't
   say so.
4. **Wedding-day operations.** `frontend/src/pages/UsherPage.jsx` does QR check-in, arrived pax,
   table, envelope number and souvenir stock. Katsudoto charges Rp300.000–700.000 around this. The
   landing page (`GROUPS` in `frontend/src/pages/LandingPage.jsx`) doesn't mention it.
5. **Inclusive defaults.** Islam / Kristen / Katolik / Umum copy, WIB / WITA / WIT events, sourced
   scripture, guest data deleted 90 days after expiry.

## 4. Strategy (recommendations)

**Positioning.** "Undangan adat berlukis yang hidup." Lead with Pesona Nusantara. Keep Taman &
Bunga as the choice for couples who want no adat, but not as the headline.

**Pricing to test.** Current plans are seeded in migration `0045_plans_and_testimonials.py` and
edited in the admin.

| Plan | Price | Includes |
|---|---|---|
| Coba | Rp0 | Any theme, 14 days, watermark |
| Taman | Rp129.000 | Taman & Bunga themes, unlimited guests, personal links, RSVP, 12 months |
| Nusantara | Rp199.000 | Every theme, open tracking, send queue |
| Hari-H | Rp349.000 | Nusantara plus usher check-in, envelope numbers, souvenir stock, a second invitation |

- Say "tamu tanpa batas, tanpa biaya tambahan" on every plan.
- Add-ons at Rp39.000–79.000: the opening animation as a 9:16 video with the couple's names, a
  printable QR and welcome-sign set in the theme's art, a custom domain.
- A struck-through price only if the plan really sold at it (the `Plan` model says the same).

**Channels.**
- Adat vendors first: sanggar rias, MUA adat, pelaminan decorators, wedding organizers. A coupon
  code each (the coupon system exists) and 20–30% per sale. Katsudoto pays 15%.
- One city at a time: Makassar, Padang, Palembang and Medan.
- Short video: each theme's opening as its own clip.
- One search page per adat ("undangan digital adat Minang"), prerendered like `/tema/<id>`.
- The free-tier watermark link, measured in the existing funnel table.

## 5. Theme review

Reviewed from `frontend/public/theme-previews/*.webp` and the section baselines of `minang` and
`sage` at 390 px. The other packs' sections were not inspected one by one.

**What works.** The Nusantara covers each have their own structure, palette and type. The dark
lacquer themes (Gonjong Songket, Lamming Zamrud, Limas Emas) look the most expensive. The gilded
photo frame, wreathed monogram and painted card corners carry the cover's quality into the page.

**What to fix, by sales impact.**
1. **Demo photos.** Every demo uses the same Western stock couples, including a black-and-white
   bride in the Minang hero. They are also unlicensed (LAUNCH-READINESS.md, blocker 2.7).
2. **Demo data.** All 13 demos are "Andini & Bagus", 12 Desember 2026, Yogyakarta venues, WIB.
3. **Sections look the same in every theme.** Below the hero each pack is a centred script title,
   a divider and rounded cards, with art only as a corner sprig. Gonjong Songket and Taman Sage are
   the same page in different paint.
4. **Gallery.** A plain grid with rounded corners. There is no full-bleed photo moment.
5. **Floral covers share one composition.** Merah Anggur, Taman Sage, Wisteria Lila and Mawar Malam
   all put a bouquet in a top corner and another in the opposite bottom corner.
6. **Six themes have no preview loop** in `shared/themes.json`: `batak`, `bali`, `palembang`,
   `rustic`, `lavender`, `navy`.
7. **Small things.** The thin scripts on Lamming Zamrud and Limas Emas make the names harder to
   read. "Live Streaming" and "Dress code" are English. A round floating button with a tick icon
   overlaps cards and map links in the section screenshots, and its purpose isn't clear.

**Catalogue gaps.** A no-photo mode; a Modern & Minimalis pack (the category is empty); a
Peranakan pack; Betawi and Melayu (already queued in CATALOG-DIRECTION.md); an optional one-line
"about this tradition" note under adat events such as mappacci or malam bainai.

**Missing art (the "wow" gap).** All 13 packs were then checked at 390 px (hero, events, couple,
gallery, closing). Every pack has the same 16 slots, and apart from the cover and hero they are all
small ornaments. No pack has a second painting, so after the hero each theme is two or three screens
of flat colour. Competitors' designs were not viewed, so this is a gap against the product's own
cover, not a measured gap against them. Four new kinds of asset close it, now specified in
`prompts/scenes/` (README there):

| Piece | Slot | Purpose |
|---|---|---|
| Mid-page scene | `scene-interlude` | a painted view behind the countdown |
| Attire pair, no people | `attire-bride`, `attire-groom` | headpieces as objects; also what the no-photo mode shows (A7) |
| Four props | `prop-1` … `prop-4` | separate objects that enter from the sides on scroll |
| Evening closing | `closing-scene` | the cover's scene at night |

Pilot prompt files exist for Gonjong Songket and Gebyok Sogan. Suggested scenes and objects for the
other eleven packs follow, as a starting point only. They come from general knowledge, and every
regional object needs that culture's reviewer:

| Theme | Scene | Props or attire |
|---|---|---|
| Lamming Zamrud | Pelaminan hall, or phinisi at sea | Bosara, bando crown, songkok recca |
| Siger Mega Mendung | Tea hills under mega mendung clouds | Siger, payung geulis, angklung |
| Gorga Ulos | Danau Toba, wide | Ulos folds, sortali headpiece, gondang |
| Jepun Prada | Rice terraces behind the gate | Tedung umbrella, gelungan headpiece |
| Limas Emas | Sungai Musi with boats | Aesan gede crown, tepak |
| Anggrek Bulan | Beach at dusk with palms | Rattan lanterns, birds |
| Merah Anggur | Velvet drape and candle still life | Candelabra, ribbon |
| Taman Sage | Glasshouse or garden arch | Hanging glass lanterns |
| Pampas Kraft | Wooden table flat-lay | Wax-sealed envelope, twine tags |
| Wisteria Lila | Wisteria pergola tunnel | Butterflies, hanging blooms |
| Mawar Malam | Night garden with string lights | Lanterns, fireflies |

## 6. Work list

### A. A session can do these alone

Follow CLAUDE.md throughout: feature branch, no merge or push unless asked, rewrite visual
baselines when a pack's look changes, never write religious text from memory.

| # | Task | Where to start | Done when |
|---|---|---|---|
| A1 | Capture preview loops for the six themes without one | `sh frontend/scripts/capture-docker.sh batak bali palembang rustic lavender navy` (needs the dev stack), then add `previewVideo` to `shared/themes.json`, `make themes`, `make check` | All 13 registry entries have `previewVideo`; each file ≤ 1,5 MB |
| A2 | Put wedding-day check-in and the trusted-link message on the landing page | `GROUPS` and `FAQS` in `frontend/src/pages/LandingPage.jsx`. Copy idea: "Tautan web biasa, bukan file APK" | The landing page names usher check-in, envelope numbers and souvenirs, and says the link is not an APK |
| A3 | Regional demo data | The `seed_demos` management command. Per Nusantara demo: names from that region, a real venue in its city with coordinates, its time zone, one adat event with a custom title. Keep photos for B1 | Each Nusantara demo differs in names, city, zone and events; visual baselines rewritten |
| A4 | Indonesian labels for "Live Streaming" and "Dress code" | `shared/copy/copy.json`, then the sync step | No English section labels on a guest page |
| A5 | Identify the floating tick button and stop it overlapping content | Visible bottom-left in `frontend/tests/visual/packs/__screenshots__/minang.spec.js/section-*-390-*.png`. Check first whether it is a test or editor artefact rather than something guests see | Either confirmed not guest-facing, or labelled and clear of cards |
| A6 | Check name legibility on Lamming Zamrud and Limas Emas at 360 px | The packs' `tokens.css` and font choices; CATALOG-DIRECTION.md §3 has the hairline-font rule | Names read cleanly at 1x, or a sturdier face is proposed with screenshots |
| A7 | No-photo mode | Check what each pack's hero, profile and gallery do with no photos uploaded. Target: monogram in the frame, no empty gallery | Every pack looks complete with zero photos; a visual test covers it |
| A8 | One signature section per pack | Start with two packs as a proposal (for example event cards following the gonjong roof line in `minang`). Show the owner screenshots before doing the rest | Owner approves the direction on two packs |
| A9 | A full-bleed photo moment in the gallery | The gallery section component and the pack layout (`docs/theme-packs.md` §4) | One large framed photo above the grid, working in every pack |
| A10 | Reserved slugs rejected at signup | Already listed in DISTRIBUTION-REPORT.md "Known gaps" 1 | `tema`, `dashboard`, `register` and the rest are refused, with a test |
| A11 | Draft the privacy policy and terms for the owner to review | Input: `docs/privacy-notes.md`. Mark it clearly as a draft that needs the owner's and ideally a lawyer's review | Draft pages exist; not published as final |
| A12 | Search pages per adat | Same prerender approach as `/tema/<id>` (DISTRIBUTION-REPORT.md §F). Any text about a tradition needs a cultural reviewer note | One page per live Nusantara theme in the sitemap |
| A13 | Prompt for the next packs | "Give me another prompt" in CLAUDE.md. Order after this review: Modern & Minimalis first, then Betawi, then Peranakan (new, needs adding to CATALOG-DIRECTION.md if the owner agrees), then Melayu. The next floral must not use the corner-bouquet composition | A `PROMPT-<THEME>-ASSETS.md` with the full set: Prompts 1–8, section pieces S1–S4 and scene pieces C1–C4 |
| A14 | Build the scene-art pilot when the owner drops the images in | "Scene art for <theme>" in CLAUDE.md; prompts in `prompts/scenes/`. The first arrival builds the shared rendering for `scene-interlude`, `attire-*`, `prop-*` and `closing-scene`; packs without the slots must not change | Pilot pack shown to the owner on screen; other packs' baselines untouched |
| A15 | Scene prompts for the other eleven live packs | Only after the owner approves the pilot. Copy the structure of the two pilot files; starting ideas are in the table at the end of §5 | One `PROMPT-<ID>-SCENES.md` per live pack, each with reviewer questions |

### B. The owner decides or supplies

| # | Decision | Notes |
|---|---|---|
| B1 | Demo photos | One Indonesian couple per Nusantara theme in that region's attire, one modern couple for the florals, all licensed. A session can wire them in once supplied |
| B2 | Brand name and domain | See §7. Affects `index.html`, the footer, OG text, email DNS and `FRONTEND_URL` |
| B3 | Pricing and plan structure | §4 is a proposal. Plans are edited in the admin; `entitlements.py` is still a placeholder that allows everything |
| B4 | Payment gateway (Phase 3) | Provider choice (QRIS and e-wallets, for example Midtrans or Xendit). LAUNCH-READINESS.md lists what Phase 3 must fill in |
| B5 | Active period | Recommendation: keep the page 12 months as a keepsake while still deleting guest data at 90 days. Changes `purge_expired` and the landing FAQ |
| B6 | Faith reviewers | One per variant for scripture and greetings (MARKETFIT-REPORT.md) |
| B7 | Vendor partner programme | Commission rate, first city, who approaches vendors |
| B8 | Add-ons | Video export, printable set, custom domain: which to build first |

### Suggested order

1. Before selling: B4, A11 then the owner's final legal text, B1 with A3, B3, B2.
2. First 60 days: A1, A2, B7, B5, the video-export add-on.
3. After that: A7, A13 (Modern & Minimalis), A8 and A9, then Betawi, Peranakan and Melayu.

## 7. Name and domain

"DearGuest" is English and says nothing about heritage. dearguest.com has been registered since
2003. dearguest.id was registered on 10 October 2026 (if that was the owner, keep it as a redirect).

| Name | .com | .id | Meaning and notes |
|---|---|---|---|
| **Meronce** (recommended) | free | free (.co.id too) | To string flowers into a garland; the ronce melati is worn by brides across Jawa, Sunda, Bugis, Minang and Bali and is already in the paintings. Also a children's bead craft, so a bare search shows school activities |
| Tamu Agung | taken | free (.co.id too) | "Honoured guest", the closest Indonesian form of DearGuest. Formal |
| Janurku | free | free | Janur kuning says "wedding" at once. Less distinctive; more Javanese, Sundanese and Balinese than Sumatran |
| Sekapur Sirih | free | free | Malay and Minang idiom for words of welcome. Long to type |
| Ulem | taken | free | Javanese for invitation. Java only |
| Kepada Yth | free | free | Witty, hard to say aloud |
| Roncean | free | free | Fallback for Meronce |

Taken on both: Ronce, Janur, Lontar, Pelaminan, Doa Restu, Kabar Bahagia.

"Free" means the registry's WHOIS returned no record and the name had no nameservers on 25
November 2026. Confirm at a registrar before buying. **Not checked:** trademarks (PDKI,
pdki-indonesia.dgip.go.id) and Instagram / TikTok handles.

## 8. Sources and limits

- Product facts: `shared/themes.json`, migration `0045`, MARKETFIT-REPORT.md, DISTRIBUTION-REPORT.md,
  LAUNCH-READINESS.md, CATALOG-DIRECTION.md, the preview images and visual baselines.
- Market: datengdong.com · katsudoto.id/v2/package · wekita.id · viding.co ·
  satumomen.com/undangan-digital · sannubari.com/rata-rata-harga-undangan-digital ·
  id.my-best.com/136926 · rri.co.id/nasional/2080410 · datareportal.com/reports/digital-2025-indonesia ·
  medcom.id (Bridestory survey) · kompas.tv/lifestyle/613512 · mojok.co/terminal/3-tips-menggunakan-undangan-pernikahan-digital
- Limits: competitor artwork not viewed; customer counts are the vendors' own claims; no first-hand
  customer reviews; pricing, channel and catalogue advice is judgement, to be tested.
