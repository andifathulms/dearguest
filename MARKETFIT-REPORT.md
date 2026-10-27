# Phase 2: Market Fit report

Branch `feat/market-fit`, based on `feat/theme-packs` (which carries Phases 0 and 1). Not merged, not pushed.

## What changed, in one paragraph each

**Copy and religion variants.** Every guest-facing string now comes from `shared/copy/copy.json`, looked up as variant → base. Four variants ship: `islam`, `kristen`, `katolik`, `umum`. A variant is data, so `hindu` / `buddha` can be added to the file without a migration. Scripture is never typed by hand: `scripts/build_scripture.py` downloads it from Tanzil and SABDA and extracts it verbatim. Every entry is marked `"verified": false`. `umum` has no religious text at all. The Islamic phrases that used to be hard-coded (the hero Bismillah, Assalamualaikum, Jazakumullah, Alhamdulillah) now appear only in the `islam` variant. English labels ("The Wedding Of", "We Are Getting Married") are gone.

**Events and time zones.**
- **Event model:** seven event types, each with an optional custom title, a start, an optional end, and a zone (WIB / WITA / WIT). There is exactly one primary event, and the countdown targets it.
- **Display:** guests see each event in its own zone, plus a "… waktu Anda" line when their device is elsewhere.
- **Date-only values:** these no longer shift a day west of UTC. A unit test runs under `TZ=America/Los_Angeles` to prove it.
- **Calendar:** one "Simpan ke Kalender" control offers a Google Calendar link (with `ctz`) and an `.ics` download.
- **Editor:** the event list gets a type picker, a zone picker that defaults to the last zone used, a primary radio, reordering, and quick-add buttons for the variant's usual events.

**Profiles and gift.** Couples can now record:
- the child's position ("Putri pertama dari");
- each parent separately, with an Alm. / Almh. flag;
- an Instagram handle.

The wording follows the person: "Putri … dari" for the bride, "Putra … dari" for the groom. The 🤍 / 🎁 emoji are gone: packs show the monogram, and legacy themes show nothing in that spot. A new optional gift shipping address has a "Salin Alamat" button, and the editor warns that every guest can see it.

**Maps.** The editor accepts a Google Maps share link or "lat, lng". It refuses pasted `<iframe>` code with a clear message, and any non-Maps URL. Coordinates are read from the link. The iframe URL is always built by the server. "Buka Peta" is always shown; the map itself loads only when the guest taps "Lihat Peta".

**RSVP and wishes.**
- **One answer per guest:** a second answer with the same personal-link code, or the same WhatsApp number in any 08 / +62 / 62 form, updates the first. The guest sees "Jawaban diperbarui".
- **Per-guest limit:** each guest can have their own pax limit, enforced by the server.
- **CSV:** the export is built server-side.
- **Wish moderation:** wishes with links, blocklisted words, or (in approval mode) all wishes are held as pending, never dropped. The couple approves, hides or deletes them in a new "Ucapan" dashboard tab.

**Images.** Every upload is re-encoded upright with no metadata (phone GPS included) and capped at 2560 px. Responsive fields also get WebP renditions at 480 / 960 / 1600 px, exposed to the client as `srcset`.

The lightbox now supports swipe, arrow keys and Escape. The phone's back button closes it, it preloads the neighbouring photos, and it shows a "3 / 12" counter. On iOS it respects the safe area. No new dependency was added.

## Commits

| Commit | What |
|---|---|
| `8b1026d` chore(shared) | copy + scripture data, build script, Tanzil licence, sync/check |
| `8d061db` feat(copy) | variants, scripture block, no hard-coded copy, editor + onboarding UI |
| `b9cb635` feat(events) | event model, `dates.js` + unit test, zones, `.ics`, countdown, editor list |
| `5fb5f87` feat(profiles) | parents with Alm./Almh., child order, Instagram, gift address |
| `e652c0a` feat(maps) | link validation, coordinates, tap-to-load, real seed venues |
| `ad5d46d` feat(rsvp) | upsert, per-guest pax limit, server CSV, wish moderation |
| `a248481` feat(images) | Pillow pipeline, renditions, backfill command, srcset, lightbox, iOS |
| `7dea24f` fix(images) | backfill visited proxy-model rows twice (see below) |
| `0db2201` test(visual) | Phase 2 Minimal states, fixture in the new API shape, steadier reveal waits |
| (this) docs | this report and `docs/market-fit/screens/` |

## Migrations and dev-database row counts

Each migration that rewrites data prints a report during `migrate`. The numbers below are from the dev database (40 invitations).

| Migration | What it did | Dev DB result |
|---|---|---|
| `0030` copy variant, scripture, gift, moderation | Two-step defaults. Existing rows were set to `islam` + scripture `none`, so they keep the Islamic phrasing they already showed and gain no new block. New invitations default to `umum` + scripture `default`. | 40 invitations set to `islam`; 40 to scripture `none` |
| `0031`–`0033` events | Schema, then data, then cleanup. The split avoids Postgres "pending trigger events". All existing times moved to `Asia/Jakarta`, unchanged. The primary event is the akad, else the earliest. Old map links: the `https://maps.google.com` placeholder was cleared; a link was derived from the old embed's `q=` when one existed. | 78 events migrated; 39 primary events set; links kept 0, placeholder cleared 76, derived from embed 76 |
| `0034`–`0035` couple family | New fields, then "Bapak X & Ibu Y" split into father/mother. "(Alm.)" / "(Almh)" in the old text becomes a flag. Text that doesn't parse stays in `*_parents`, which still renders. | 77 split, 2 kept as free text (both `-`), 3 empty |
| `0036`–`0038` RSVP | New fields, then WhatsApp normalisation and merging of older duplicates (latest kept). Then partial unique constraints, per guest and per number among rows without a guest. | 1 RSVP; 0 normalised; 0 merged |
| `0039` processed images | New `ProcessedImage` table. Old files are processed with `manage.py process_images --apply`. | 296 stored images: 0 had EXIF, 296 processed, 0 failed. Media grew 32 MB → 40 MB. |

**Backfill bug, found and fixed in `7dea24f`.** The first `--apply` on the dev DB visited `ActivationRequest`, a proxy of Invitation, as a second model. As a result, 37 demo hero images were re-encoded twice, and 37 orphaned `-w480.webp` files remain in the dev `media/` folder. The command now skips proxy models and processes each file once per run. A rendition now replaces a stale file of the same name instead of writing a suffixed copy. There is a regression test.

## Scripture entries

Source data: `shared/copy/scripture.json`, built by `scripts/build_scripture.py`. The SHA-256 of every downloaded source is recorded in the file. **All five entries are unverified.** A person of each faith must check each one against the source before launch.

| id | Reference | Variants | Text from | Licence / permission | Verified |
|---|---|---|---|---|---|
| `bismillah` | QS. Al-Fatihah: 1 | islam (hero blessing) | Arabic, Tanzil Uthmani v1.1 | CC BY 3.0, verbatim, no changes; credit + link shown on the page | **no** |
| `ar-rum-30-21` | QS. Ar-Rum: 21 | islam (default verse) | Arabic: Tanzil Uthmani. Indonesian: Kemenag via Tanzil `id.indonesian`, **2010 edition** (last updated 2010-06-04), not the 2019 revision. | Arabic CC BY 3.0. Translation: **permission to be confirmed with Kemenag**. | **no** |
| `kejadian-2-24` | Kejadian 2:24 | kristen (default), katolik | Alkitab Terjemahan Baru via alkitab.sabda.org | TB © LAI: **permission to publish to be confirmed with LAI** | **no** |
| `matius-19-6` | Matius 19:6 | katolik (default), kristen | same | same | **no** |
| `pengkhotbah-4-12` | Pengkhotbah 4:12 | kristen, katolik (choosable) | same | same | **no** |

Things a reviewer should look at:
- **Matius 19:6 ends with a closing quotation mark (`… diceraikan manusia."`).** The quote is part of the TB text, because Jesus' speech opens in an earlier verse. It was extracted verbatim and deliberately not edited. A reviewer may prefer a different verse, or the couple can use "ayat sendiri".
- **Catholic couples in Indonesia often use the TB Deuterokanonika edition.** These three verses read the same in both editions, but a Catholic reviewer should confirm that.
- **Wherever Quran text is shown, the page shows "Teks Al-Qur'an: Tanzil.net" with a link.** That includes the hero Bismillah (the credit sits in the scripture area). `TANZIL-LICENSE.txt` carries the copyright block.

## Copy keys that differ per variant

Every other key (87 in the base) is the same for all variants. The table lists the keys a variant overrides; "base" means the variant uses the base value. This is the list a faith reviewer needs to read. Apart from what's quoted from the existing product, none of it is scripture.

| Key | islam | kristen | katolik | umum (= base) |
|---|---|---|---|---|
| hero blessing | Bismillah (from Tanzil) | none | none | none |
| default verse | QS. Ar-Rum: 21 | Kejadian 2:24 | Matius 19:6 | none |
| default events | akad, resepsi | pemberkatan, resepsi | sakramen, resepsi | resepsi |
| `greeting.default` | Assalamu'alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami. | Salam sejahtera dalam kasih Tuhan. Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari pernikahan kami. | Salam damai dalam Kristus. Dengan penuh syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan mendoakan Sakramen Perkawinan kami. | Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari pernikahan kami. |
| `closing.default` | … berkenan hadir dan memberikan doa restu. Wassalamu'alaikum Warahmatullahi Wabarakatuh. | Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan sukacita bagi kami. Tuhan memberkati. | Kehadiran dan doa Bapak/Ibu/Saudara/i merupakan berkat bagi kami. Tuhan memberkati. | Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. |
| `countdown.passed` | Alhamdulillah, hari bahagia telah tiba | Puji Tuhan, hari bahagia telah tiba | Syukur kepada Tuhan, hari bahagia telah tiba | Hari bahagia telah tiba |
| `rsvp.thanks` | Jazakumullah khairan. Konfirmasi Anda telah kami terima. | Terima kasih, Tuhan memberkati. Konfirmasi Anda telah kami terima. | (same as kristen) | Terima kasih. Konfirmasi Anda telah kami terima. |
| `rsvp.updated` | Jawaban diperbarui. Jazakumullah khairan. | Jawaban diperbarui. Tuhan memberkati. | (same as kristen) | Jawaban diperbarui. Terima kasih. |
| `share.greeting` | Assalamualaikum | Salam sejahtera | Salam damai | Halo |
| `invite.text` (GuestManager WhatsApp) | starts "Assalamualaikum Wr. Wb." | base, opening with the variant's `share.greeting` | base | base |

The Islamic lines are the ones the product already used. The kristen and katolik greetings and closings are conventional Indonesian church-invitation phrasing written for this phase. **They need review by a Protestant and a Catholic reader.**

## Maps: root cause of the "empty" maps (RECON §6.20)

The embeds weren't broken. Two things made them look empty:
1. **Timing.** Each embed is a full Google Maps app (about 40 requests) behind `loading="lazy"`. The RECON full-page capture ran before it painted. Given time after scrolling into view, the iframe renders.
2. **Wrong place.** The seed embed searched `q=yogyakarta`, the whole city, so even when loaded it never showed the venue.

Fixes:
- The server builds the embed from coordinates (or venue + address).
- It loads only on "Lihat Peta", so a page with two maps no longer pulls about 80 requests on open.
- The seeds use real venues with OpenStreetMap coordinates (Masjid Gedhe Kauman; Royal Ambarrukmo Yogyakarta).

One trap for whoever writes tests: element screenshots in headless Chromium can drop the cross-origin iframe and show a blank box while the map is actually rendered. Use viewport screenshots or stub the iframe, as the visual suite does.

## Screenshots

| What | File |
|---|---|
| 3 legacy demos + Minimal, cover and hero, before vs after (360 px) | [`legacy-before-after-cover-hero.jpg`](docs/market-fit/screens/legacy-before-after-cover-hero.jpg) |
| Full pages before vs after | [`demo-javanese`](docs/market-fit/screens/demo-javanese-full-before-after.jpg), [`demo-floral`](docs/market-fit/screens/demo-floral-full-before-after.jpg), [`demo-navy`](docs/market-fit/screens/demo-navy-full-before-after.jpg), [`demo-minimal`](docs/market-fit/screens/demo-minimal-full-before-after.jpg) |
| Minimal per variant (hero, scripture, events), all 6 projects | `frontend/tests/visual/packs/__screenshots__/market-fit.spec.js/variant-*` |
| WITA event seen from a WIB device | `…/market-fit.spec.js/events-wita-from-wib-*` |
| Lightbox, RSVP limit / updated, profile with Alm./Almh. + Instagram, gift address, one map loaded | `…/market-fit.spec.js/{lightbox,rsvp-*,profile-late-instagram,gift-address,maps-one-loaded}-*` |

The legacy demos render without errors (no page errors or console errors on cover, hero and full page). As agreed, they are no longer pixel-identical. The visible changes are:
- English labels became Indonesian.
- Event times now read "08.00 – 10.00 WIB".
- The 🤍 profile divider is gone.

## Tests

- **Backend:** 132 tests, all passing (`make test`). New suites: `test_copy_variants`, `test_events`, `test_profiles`, `test_maps`, `test_rsvp`, `test_images`. Each data migration has a migration test.
  - The suite now takes about 58 s instead of 24 s, because the `seed_demos` test now processes every demo image.
- **Frontend unit:** `make test-unit`, 7 tests run under `TZ=America/Los_Angeles`, passing.
- **Visual (Linux Docker, Chromium + WebKit at 360 / 390 / 1440):** `make visual` ran 114 tests (19 per project). The last two full passes in a row were both clean.
  - The new `market-fit.spec.js` adds 10 tests per project.
  - The Minimal section baselines were regenerated. The scripture section shifted every index, and the fixture moved to the new API shape.
  - Every pair of old and new baselines was reviewed side by side before the update.
- **Visual suite hardening.** Getting the suite stable exposed four test-harness problems, all now fixed in `stub.js`'s `waitRevealed`:
  1. **Cards captured mid-reveal.** Section shots waited for the section wrapper only, but cards fade in on their own. One WebKit baseline had been recorded with the first event card still invisible. The wait now covers every animated child.
  2. **WebKit's in-view check.** It sometimes ignores a 2 px wheel nudge after a programmatic scroll; a Story card then never appeared. The wait now scrolls each still-hidden part into view and wheels about 60 px, like a person scrolling.
  3. **Wheel and hover side effects.** The wheel ran wherever the pointer was, so it scrolled the wishes list instead of the page, and left a "Salin Nomor" button in its hover state. It now runs from the page corner.
  4. **Slow intro exit.** Under full-suite load the intro sometimes took over 5 s to unmount; that wait now allows 10 s, like the other intro waits.
- **Production build:** `vite build` is clean.
- **`make check`:** registry, copy and token contract all OK.
- **Checked in a real browser against the dev API (not stubbed):**
  - editor event list (types, WITA, primary);
  - profile editor;
  - RSVP over the personal-link limit, then update, then held wish, then dashboard approve, then CSV download;
  - lightbox swipe, back button, focus return;
  - tap-to-load map.
  - These were checked in Chromium on macOS; WebKit coverage comes from the Docker suite.

## Deviations from the plan, and deferrals

- **Existing invitations were set to `islam`**, so their Islamic phrasing survives unchanged. Where an existing invitation had a blank greeting or closing, it now shows the `islam` default text, where before it showed nothing.
- **Onboarding sets the variant but does not create events server-side.** The editor instead offers one-click buttons for the variant's usual events.
- **WebGL themes (the 8 `*-3d` families) get the copy variants but not the scripture block.** Their layouts are hand-built and weren't touched beyond the countdown target.
- **Legacy hero photos are CSS backgrounds**, so they still load the full original (now capped at 2560 px and stripped) rather than a `srcset` rendition. Packs use `srcset`.
- **Replaced or deleted uploads and their renditions are not removed from storage.** This was true before this phase; renditions follow the same policy.
- **Short Maps links (`maps.app.goo.gl`) are kept but never followed by the server** (following them would be a server-side request to user-supplied URLs). For those, the embed uses venue + address.
- **The RSVP CSV has exactly the planned columns:** Nama, Kode Tamu, Grup, Kehadiran, Jumlah, Ucapan, Dikirim, Diperbarui. It has no WhatsApp column; the dashboard table still shows the number.
- **On a re-answer, a blank wish keeps the earlier wish.** This came out of testing: a guest changing attendance from a fresh form was erasing their wish. The couple can still delete a wish.
- **A decompression bomb gets DRF's generic "gambar tidak valid" message.** DRF's own image check rejects it before our 50-megapixel validator can give the clearer message; that validator still guards admin and code paths.
- **The lightbox keeps its arrow buttons on phones.** Swipe is added on top, because VoiceOver users need the buttons.
- **Out of scope as planned:** payments, tier gating, landing and pricing copy, OG images, the WhatsApp blast UI, English, new packs, and Hindu / Buddhist variants (data-addable).
