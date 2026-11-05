# Privacy-policy notes (input for the policy, not the policy)

These are the facts the privacy policy has to state, as built in Phase 5. **This is not the policy.** Write it with someone who knows UU PDP 27/2022.

## What is collected, from whom

| From | Data | Why |
|---|---|---|
| The couple (account) | username, email, WhatsApp number, password (hashed) | Login, password reset, activation, deletion notices |
| The couple (invitation) | names, parents' names, photos, bios, Instagram handle, event venues and addresses, bank or e-wallet accounts and QRIS images, gift address and phone, music | Shown on their invitation |
| The couple, about their guests | guest names, WhatsApp numbers, groups, how many people | Personal links, sending, check-in |
| Guests | name, WhatsApp (optional), attendance, number of people, wishes | RSVP and the wishes wall |
| Guests opening a personal link | the time, and how many times it was opened | Shown to the couple who sent it |
| Visitors to the marketing site | an anonymous count per week and campaign (`utm_*`); no IP, cookie id or user | Measuring which campaigns bring couples |

**No IP address, device or location is stored** with any of this. The rate limiter holds addresses in memory for at most an hour.

## Sentences the policy needs

1. **Open tracking (Phase 4):** "Saat tamu membuka tautan undangan pribadinya, DearGuest mencatat waktu dan berapa kali tautan dibuka, lalu menampilkannya kepada pasangan yang mengirim undangan. Kami tidak menyimpan alamat IP, perangkat, atau lokasi tamu."
2. **Retention:** guest lists, RSVPs, wishes, open tracking, uploaded photos and music, bank accounts and QRIS, the gift address and phone, and link-preview images are **deleted 90 days after the invitation's end date** (`expires_at`, itself 90 days after the wedding by default). The couple is emailed 7 days before, with a link to download everything.
3. **What stays after that:** the invitation's address (slug), the couple's names, the story and event details, until the couple deletes the account.
4. **Couples' rights:**
   - download everything an invitation holds (dashboard: Data & privasi → Unduh semua data, a ZIP);
   - delete the account and all invitations at any time (Hapus akun).
   - Both ask for the password again.
5. **Invoices** (once payments exist): kept **10 years** for bookkeeping, with personal data removed when the account is deleted. *Confirm the period with your accountant.*
6. **Backups:** encrypted nightly copies are kept up to 6 months (7 daily, 4 weekly, 6 monthly). Data deleted from the site disappears from backups as they age out.

## Where data goes (processors)

| Processor | What | Where |
|---|---|---|
| VPS provider (TBD: 2 vCPU / 4 GB near Singapore/Jakarta) | everything (database, files) | the server's region |
| Cloudflare (CDN, DNS) | all traffic passes through; caches static files, media and link-preview images | global edge |
| Cloudflare R2 | encrypted database backups (key held offline by the owner), media mirror | R2 region |
| Sentry | error reports and 5 % of performance traces, **scrubbed**: no names, numbers, emails, addresses, guest codes, tokens or request bodies | Sentry's region (choose EU or US at signup) |
| Brevo (email) | couples' email addresses and the email text (password reset, activation, deletion notice) | Brevo |
| UptimeRobot | fetches public pages and the health endpoint; no personal data | UptimeRobot |
| Telegram | ops alerts (job names, never data) | Telegram |
| Google (Maps embed, Fonts), YouTube | loaded by guests' browsers when a map is opened, for the marketing fonts, and for a livestream | Google |
| Payment provider (Phase 3, TBD) | — | — |
