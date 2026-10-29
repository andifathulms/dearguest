# Real-device test pass

Run this on **real phones** before launch and after any large frontend change. Emulators miss what matters here: WhatsApp's in-app browser, iOS audio rules, `.ics` handling, slow CPUs.

**Devices**

| Short name | Device | Browsers |
|---|---|---|
| **A** | Low-end Android (≤ 3 GB RAM, e.g. Redmi A-series / Samsung A0x), Android 12+ | Chrome; WhatsApp in-app browser |
| **I** | iPhone (iOS 17+) | Safari; WhatsApp in-app browser |

That gives four columns: **A-Chrome**, **A-WA**, **I-Safari**, **I-WA**. Use mobile data, not Wi-Fi, for at least one column on each phone.

**Set-up**
- A real invitation on the production site, active, with:
  - photos, music, 2 events (one with a map), a story;
  - bank account + QRIS, wishes enabled;
  - a guest list with your own number.
- From the dashboard, send yourself the personal link with **Kirim via WhatsApp**.

**Marks:** ✅ works · ⚠️ works with a problem (describe it) · ❌ broken (describe it, attach a screenshot or screen recording).

| # | Step | What should happen | A-Chrome | A-WA | I-Safari | I-WA |
|---|---|---|---|---|---|---|
| 1 | Tap the personal link in WhatsApp | Preview card (painting, names, date, "Kepada Yth. <your name>"); the link opens | | | | |
| 2 | Cover / opening animation | Cover shows your name; "Buka Undangan" opens with the theme's animation; nothing flickers or jumps | | | | |
| 3 | Music | Starts after "Buka Undangan" (or on the first tap on iPhone); the floating button mutes and unmutes | | | | |
| 4 | Scroll every section | Hero, greeting / scripture, couple, events, countdown, story, gallery, gift, RSVP, wishes, closing; no blank sections, no horizontal scroll, text readable | | | | |
| 5 | Save to calendar | Android: Google Calendar link opens. iPhone: the `.ics` opens the "Add to Calendar" sheet with the right time **in the event's zone** (WIB/WITA/WIT) | | | | |
| 6 | Maps | "Lihat Peta" loads the map; "Buka Peta" opens Google Maps (app if installed) | | | | |
| 7 | Gallery | Tap a photo; swipe left and right; close with ✕ and with the back gesture | | | | |
| 8 | RSVP | Name prefilled from the list, the limit shows ("untuk N orang"); submit; "Terima kasih"; submit again shows "Jawaban diperbarui" | | | | |
| 9 | Wishes | Your wish appears (or "menunggu persetujuan" if moderation is on); older wishes load | | | | |
| 10 | Copy bank details | "Salin" copies the account number (paste it into WhatsApp to check) | | | | |
| 11 | QRIS | Long-press or the button saves the QRIS image to the photo library | | | | |
| 12 | Couple's dashboard | Log in on the phone; RSVP list, guest list (sent / opened / RSVP counts) and wishes moderation work | | | | |
| 13 | Send queue | `/dashboard/<slug>/kirim`: "Kirim via WhatsApp" opens WhatsApp with the message; coming back marks the guest sent (with "Batalkan") | | | | |
| 14 | Open tracking | After opening your own link (step 1, not logged in), the dashboard shows "dibuka" for you | | | | |
| 15 | Checkout, each payment method | **Phase 3, not built yet** | — | — | — | — |
| 16 | Slow network | Throttle or use weak signal: the cover appears within a few seconds; nothing is stuck on a spinner | | | | |
| 17 | Rotate / back button | Rotating doesn't break the layout; back goes back (closes the gallery first) | | | | |

**Notes / issues found**

| # | Device / browser | What happened | Screenshot |
|---|---|---|---|
| | | | |

**Result**
- Pass date: ________
- Tested by: ________
- Release (from `/api/health/`): ________
