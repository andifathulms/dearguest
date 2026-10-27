# Sources for religious text

Scripture and the Islamic hero blessing are **never typed by hand**. `scripts/build_scripture.py`
downloads them from the named sources and extracts them verbatim into `scripture.json`
(SHA-256 of each downloaded source is recorded there). Rebuild with `make scripture && make sync`.

| Text | Source | Licence / permission |
|---|---|---|
| Quran, Arabic (Uthmani) | Tanzil Quran Text v1.1, https://tanzil.net | CC BY 3.0. Verbatim copies only, **no changes**. Source must be shown with a link to tanzil.net (the invitation shows "Teks Al-Qur'an: Tanzil.net"). The copyright block is in `TANZIL-LICENSE.txt` and must travel with the text. |
| Quran, Indonesian translation | Kementerian Agama RI, via Tanzil `id.indonesian` (last updated 2010-06-04) | Permission to publish to be confirmed with Kemenag. This is the 2010 edition, not the 2019 revision. |
| Bible verses (kristen, katolik) | Alkitab Terjemahan Baru (TB), via https://alkitab.sabda.org | TB © Lembaga Alkitab Indonesia. Permission to publish to be confirmed with LAI. Catholic couples in Indonesia commonly use the TB (Deuterokanonika edition); the verses used here are in both editions; a Catholic reviewer should confirm. |

Every entry has `"verified": false` until a person has checked it against the source.
The guest-facing copy in `copy.json` (greetings, closings, thank-you lines) contains no
scripture; its religious phrasing still needs review by someone of each faith.
