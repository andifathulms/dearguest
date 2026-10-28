#!/usr/bin/env python3
"""Fetch invitation links the way WhatsApp, Facebook and Telegram do and print
what their link preview would show: the tags, and the image's size and weight.

    python3 scripts/crawl_check.py http://localhost:5190 demo-taman-sage 63YR9R
    python3 scripts/crawl_check.py https://dearguest.id <slug> [<guest code>]

Run it against the site origin people open (Vite in dev, nginx in prod), not
the backend directly, so the crawler routing is checked too.
"""
import io
import re
import sys
import urllib.error
import urllib.request
from html import unescape

AGENTS = {
    'WhatsApp': 'WhatsApp/2.23.20.0 A',
    'Facebook': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Telegram': 'TelegramBot (like TwitterBot)',
}
TAGS = ('og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height',
        'twitter:card', 'robots')
META = re.compile(r'<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"', re.I)


def fetch(url, agent):
    req = urllib.request.Request(url, headers={'User-Agent': agent})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return res.status, res.headers, res.read()
    except urllib.error.HTTPError as err:
        return err.code, err.headers, err.read()


def describe_image(url, agent):
    status, headers, body = fetch(url, agent)
    size = ''
    try:
        from PIL import Image
        size = '{}x{}'.format(*Image.open(io.BytesIO(body)).size)
    except Exception:  # Pillow missing or not an image
        pass
    return f"{status} {headers.get('Content-Type', '?')} {size} {len(body) // 1024} KB" \
           f" · cache: {headers.get('Cache-Control', '-')}"


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    origin, slug = sys.argv[1].rstrip('/'), sys.argv[2]
    code = sys.argv[3] if len(sys.argv) > 3 else None
    paths = [f'/{slug}', f'/{slug}?to=Siapa%20Saja', f'/share/{slug}/']
    if code:
        paths += [f'/{slug}/{code}', f'/share/{slug}/?to=Budi&g={code}']
    paths += ['/', '/tema']

    for path in paths:
        for name, agent in AGENTS.items():
            status, headers, body = fetch(origin + path, agent)
            tags = {k: unescape(v) for k, v in META.findall(body.decode('utf-8', 'replace'))}
            print(f'\n{name:9} {path}  → {status}  X-Robots-Tag: {headers.get("X-Robots-Tag", "-")}')
            for key in TAGS:
                if key in tags:
                    print(f'  {key:16} {tags[key]}')
            image = tags.get('og:image')
            if image and name == 'WhatsApp':
                # The image's origin is the public one; fetch it via the origin under test.
                local = origin + image[image.index('/', image.index('//') + 2):]
                print(f'  {"image":16} {describe_image(local, agent)}')


if __name__ == '__main__':
    main()
