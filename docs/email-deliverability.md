# Email deliverability (Brevo, `mail.<domain>`)

DearGuest sends three kinds of email:
- password resets;
- activation requests (to the admin);
- deletion notices (to couples, 7 days before guest data is deleted).

Receipts and reminders arrive with Phase 3. These steps keep all of them out of spam.

## 1. Brevo

1. Create the Brevo account and add the sending domain **`mail.<domain>`**. Use a subdomain, so the main domain's reputation stays separate.
2. Brevo shows the exact DNS records to add. Create them in Cloudflare DNS with the proxy **off** (grey cloud).
3. Settings in `.env`:

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<Brevo SMTP login>
EMAIL_HOST_PASSWORD=<Brevo SMTP key>
DEFAULT_FROM_EMAIL=DearGuest <halo@mail.<domain>>
ADMIN_EMAIL=<your inbox>
```

## 2. DNS records (shape; copy the values from Brevo)

| Type | Name | Value |
|---|---|---|
| TXT (SPF) | `mail.<domain>` | `v=spf1 include:spf.brevo.com ~all` |
| TXT (DKIM) | `brevo._domainkey.mail.<domain>` (Brevo gives the selector) | the public key Brevo shows |
| TXT (Brevo verification) | `mail.<domain>` | `brevo-code:…` |
| TXT (DMARC) | `_dmarc.mail.<domain>` | `v=DMARC1; p=none; rua=mailto:dmarc@<domain>; adkim=s; aspf=s` |

- **DMARC:** start at `p=none` and read the reports for two weeks. Then move to `p=quarantine`, and later `p=reject`.
- **Gmail and Yahoo's bulk-sender rules (2024)** require SPF + DKIM + DMARC alignment for everyone. Marketing email would also need one-click unsubscribe; our emails are transactional.

## 3. Verify before launch (manual; there's no domain yet)

1. Send each email to a **Gmail** and a **Yahoo** address. Use the prod-like stack against Brevo, or the real server.
   - Password reset: "Lupa kata sandi" on `/dashboard`.
   - Deletion notice: `manage.py shell` → `from apps.invitations import retention; retention.send_notice(inv)` for a test invitation.
2. In Gmail, open **Show original** and check that SPF, DKIM and DMARC are all **PASS**. In Yahoo, check **View raw message** for the same.
3. Check where it landed: Inbox, not Spam or Promotions.
4. Run the address through mail-tester.com and aim for 9/10 or better.
5. Record the results in `LAUNCH-READINESS.md`'s checklist.
