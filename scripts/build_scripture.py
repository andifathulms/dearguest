#!/usr/bin/env python3
"""Build shared/copy/scripture.json from named sources, verbatim.

Scripture text is never typed by hand. This script downloads:
  * Tanzil Quran text (Uthmani)        https://tanzil.net  (CC BY 3.0, no changes allowed)
  * Tanzil Indonesian translation       id.indonesian = Kementerian Agama RI translation
  * Alkitab SABDA, Terjemahan Baru (TB) https://alkitab.sabda.org  (TB (c) Lembaga Alkitab Indonesia)

and extracts the listed verses mechanically: the Quran files are "sura|aya|text"
lines; SABDA verse text is the text after the verse-number anchor with every
footnote / cross-reference <sup> element removed. Every entry is written with
"verified": false; a person must check each against the source and confirm
publication permission. If a verse can't be extracted, it is written with an
empty text (reference only), never guessed.

Usage: python3 scripts/build_scripture.py   (needs network)
"""
import hashlib
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'shared' / 'copy' / 'scripture.json'
LICENSE_OUT = ROOT / 'shared' / 'copy' / 'TANZIL-LICENSE.txt'

TANZIL_TEXT = 'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true'
TANZIL_ID = 'https://tanzil.net/trans/?transID=id.indonesian&type=txt-2'
SABDA = 'https://alkitab.sabda.org/passage.php?passage={ref}&version=tb'

QURAN = [
    # (id, variants, display ref, sura, aya)
    ('ar-rum-30-21', ['islam'], 'QS. Ar-Rum: 21', 30, 21),
]
BISMILLAH = ('bismillah', 1, 1)  # hero blessing line for the islam variant (Arabic only)
BIBLE = [
    # (id, variants, display ref, SABDA passage)
    ('kejadian-2-24', ['kristen', 'katolik'], 'Kejadian 2:24', 'Kej 2:24'),
    ('matius-19-6', ['kristen', 'katolik'], 'Matius 19:6', 'Mat 19:6'),
    ('pengkhotbah-4-12', ['kristen', 'katolik'], 'Pengkhotbah 4:12', 'Pkh 4:12'),
]


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'DearGuest scripture build (contact: repo owner)'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def quran_lines(raw):
    verses, comments = {}, []
    for line in raw.decode('utf-8').splitlines():
        if line.startswith('#'):
            comments.append(line)
        elif line.count('|') >= 2:
            sura, aya, text = line.split('|', 2)
            verses[(int(sura), int(aya))] = text
    return verses, comments


def sabda_verse(raw):
    """Verse text after the <span class="vref"> anchor, minus every <sup>…</sup>."""
    page = raw.decode('utf-8', errors='replace')
    m = re.search(r'<span class="vref">[^<]*</span></a>(.*?)</div>', page, re.S)
    if not m:
        return ''
    body = re.sub(r'<sup\b.*?</sup>', '', m.group(1), flags=re.S)  # footnote + cross-reference markers
    body = re.sub(r'<[^>]+>', '', body)
    return re.sub(r'\s+', ' ', html.unescape(body)).strip()


def main():
    sources = {}
    arabic_raw = fetch(TANZIL_TEXT)
    indo_raw = fetch(TANZIL_ID)
    sources['tanzil-uthmani'] = {'url': TANZIL_TEXT, 'sha256': sha(arabic_raw)}
    sources['tanzil-id.indonesian'] = {'url': TANZIL_ID, 'sha256': sha(indo_raw)}
    arabic, arabic_notice = quran_lines(arabic_raw)
    indo, indo_notice = quran_lines(indo_raw)

    # The Tanzil terms require their copyright block with every copy of the text.
    LICENSE_OUT.write_text('\n'.join(arabic_notice) + '\n\n' + '\n'.join(indo_notice) + '\n', encoding='utf-8')

    entries = []
    _, b_sura, b_aya = BISMILLAH
    entries.append({
        'id': 'bismillah', 'variants': ['islam'], 'kind': 'blessing', 'ref': 'QS. Al-Fatihah: 1',
        'arabic': arabic.get((b_sura, b_aya), ''), 'text': '',
        'source': 'Tanzil Quran Text (Uthmani, v1.1), tanzil.net', 'license': 'CC BY 3.0; verbatim, no changes',
        'verified': False,
    })
    for vid, variants, ref, sura, aya in QURAN:
        entries.append({
            'id': vid, 'variants': variants, 'kind': 'scripture', 'ref': ref,
            'arabic': arabic.get((sura, aya), ''),
            'text': indo.get((sura, aya), ''),
            'source': 'Arabic: Tanzil Quran Text (Uthmani, v1.1), tanzil.net. '
                      'Translation: Kementerian Agama RI via Tanzil (id.indonesian, last updated 2010-06-04).',
            'license': 'Arabic CC BY 3.0 (verbatim). Translation: permission to confirm with Kemenag; '
                       'note this is the 2010 edition, not the 2019 revision.',
            'verified': False,
        })
    for vid, variants, ref, passage in BIBLE:
        url = SABDA.format(ref=urllib.parse.quote(passage))
        raw = fetch(url)
        sources[f'sabda-{vid}'] = {'url': url, 'sha256': sha(raw)}
        entries.append({
            'id': vid, 'variants': variants, 'kind': 'scripture', 'ref': ref, 'arabic': '',
            'text': sabda_verse(raw),
            'source': 'Alkitab Terjemahan Baru (TB), via alkitab.sabda.org',
            'license': 'TB (c) Lembaga Alkitab Indonesia; permission to publish must be confirmed with LAI.',
            'verified': False,
        })

    OUT.write_text(json.dumps({
        '_about': 'GENERATED by scripts/build_scripture.py from the sources below. Never edit verse text by hand. '
                  'Every entry is unverified until a person checks it against the source.',
        'sources': sources,
        'entries': entries,
    }, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    for e in entries:
        print(f"{e['id']:18s} arabic={len(e['arabic']):4d} chars  text={len(e['text']):4d} chars  {e['ref']}")


if __name__ == '__main__':
    main()
