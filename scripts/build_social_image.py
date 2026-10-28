#!/usr/bin/env python3
"""The marketing site's link preview (frontend/public/social/dearguest.jpg):
a 1200x630 strip of every active pack's phone cover, with the brand on a
calm band across the middle. Re-run after adding or retiring a pack.

    python3 scripts/build_social_image.py
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PACKS = ROOT / 'frontend/src/themes/packs'
OUT = ROOT / 'frontend/public/social/dearguest.jpg'
SIZE = (1200, 630)
BAND = (0, 205, 1200, 425)
INK = (61, 71, 65)
ACCENT = (138, 111, 62)
FONTS = PACKS / 'sage/fonts'


def covers():
    themes = json.loads((ROOT / 'shared/themes.json').read_text())['themes']
    return [PACKS / t['id'] / 'assets/cover-bg.jpg' for t in themes if t.get('status', 'active') == 'active']


def main():
    paths = covers()
    w = SIZE[0] // len(paths)
    canvas = Image.new('RGB', SIZE, (246, 241, 232))
    for i, path in enumerate(paths):
        im = Image.open(path).convert('RGB')
        scale = SIZE[1] / im.height
        im = im.resize((round(im.width * scale), SIZE[1]), Image.LANCZOS)
        left = (im.width - w) // 2
        canvas.paste(im.crop((left, 0, left + w, SIZE[1])), (i * w, 0))

    band = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    ImageDraw.Draw(band).rectangle(BAND, fill=(250, 247, 240, 236))
    shadow = band.getchannel('A').filter(ImageFilter.GaussianBlur(14)).point(lambda a: a // 3)
    base = canvas.convert('RGBA')
    base.paste((0, 0, 0), mask=shadow)
    image = Image.alpha_composite(base, band)

    draw = ImageDraw.Draw(image)
    brand = ImageFont.truetype(str(FONTS / 'script-400.woff2'), 104)
    tag = ImageFont.truetype(str(FONTS / 'label-500.woff2'), 26)
    cx, cy = SIZE[0] / 2, (BAND[1] + BAND[3]) / 2
    draw.text((cx, cy - 18), 'DearGuest', font=brand, fill=INK, anchor='ms')
    tagline = 'UNDANGAN PERNIKAHAN DIGITAL'
    spacing = 5
    width = sum(tag.getlength(c) for c in tagline) + spacing * (len(tagline) - 1)
    x = cx - width / 2
    for c in tagline:
        draw.text((x, cy + 52), c, font=tag, fill=ACCENT, anchor='ls')
        x += tag.getlength(c) + spacing

    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.convert('RGB').save(OUT, 'JPEG', quality=84, optimize=True, progressive=True)
    print(f'{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB, {len(paths)} packs')


if __name__ == '__main__':
    main()
