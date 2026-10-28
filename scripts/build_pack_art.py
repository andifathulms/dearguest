#!/usr/bin/env python3
"""Turn a pack's painted masters into its slot files.

    python3 scripts/build_pack_art.py floral

Masters live in design/packs/<pack>/masters/ (the full-size paintings, kept so
the slot files can be rebuilt); output goes to frontend/src/themes/packs/<pack>/assets/.
Each pack's recipe is in PACKS below. Needs Pillow (with AVIF), numpy, scipy.

Painted art comes from an image model that can't export transparency, so
cut-outs are painted on a flat background colour and keyed here:
  * alpha is a soft ramp on the colour distance from that background;
  * the silhouette is morphologically closed first, so dark petals inside a
    flower (close to the background colour) stay solid instead of see-through;
  * leftover background in the semi-transparent edge is removed ("unmixed"),
    so no coloured fringe shows on another background.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent

PACKS = {
    'floral': {
        'opaque': [
            # name, master, width, formats
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # Painted bands cut from one painting, fading into the page: the framed
        # hero pins the top band to its top and the bottom band to its bottom,
        # so it can grow to fit its content without flowers covering the names.
        # name, master, from, to (fractions of height), fade edge, fade fraction, width
        'bands': [
            ('hero-top', 'hero-overlay.jpg', 0.0, 0.48, 'bottom', 0.35, 1080),
            ('hero-bottom', 'hero-overlay.jpg', 0.55, 1.0, 'top', 0.3, 1080),
        ],
        'keyed': [
            # name, master, background RGB, width, (soft ramp lo, hi), close radius px (at master size), fill holes
            # (the wreath keeps its open centre for the photo; everything else is solid inside its outline)
            ('photo-ring', 'photo-ring.jpg', (55, 12, 21), 880, (22, 58), 4, False),
            ('corner-tl', 'corner-tl.jpg', (57, 14, 23), 720, (22, 58), 4, True),
        ],
        # petals-sheet: a grid of separate sprites, each cut and keyed on its own.
        # Closing strength per sprite (reading order): solid petals need a strong
        # one; the star-shaped jasmine and the orchid need a light one, or the
        # gaps between their petals get filled with background.
        'sprites': ('petals-sheet.jpg', (55, 12, 21), 'petal', 96, (22, 58), (24, 10, 2, 3, 4, 4)),
        'texture': ('texture.jpg', 512, 70),
    },
    'javanese': {
        # Cut-outs on flat teal (#1E8C8C asked; ~#248788 delivered): far from every colour in
        # the art, so no hole filling is needed -- and it would be wrong here, because the
        # melati strings form closed loops that must stay open.
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: garland strings hang to ~48 % at the sides (centre clear from ~35 %);
        # kembar mayang rise from ~67 % at the sides (centre clear down to ~88 %).
        'bands': [
            ('hero-top', 'hero.jpg', 0.0, 0.52, 'bottom', 0.22, 1080),
            ('hero-bottom', 'hero.jpg', 0.62, 1.0, 'top', 0.2, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (36, 135, 136), 880, (24, 60), 3, False),
            ('corner-tl', 'corner-tl.jpg', (30, 128, 128), 720, (24, 60), 3, False),
        ],
        'sprites': ('petals-sheet.jpg', (39, 135, 137), 'petal', 96, (24, 60), (2, 3, 4, 4, 3, 2), False),
        'texture': ('texture.jpg', 512, 70),
    },
    'sage': {
        # Cut-outs on flat cobalt (#2340C8 asked; ~#2245B8 delivered). No hole filling:
        # the wreath and the baby's breath have open gaps that must stay open.
        # Despill: translucent watercolour picks up the blue; the palette has no blues.
        'despill': True,
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: the centre column is clear from ~28 % to ~72 %; the side greenery
        # reaches ~45 % (top) and ~68 % (bottom).
        'bands': [
            # the fade starts below the last hanging leaf (~0.46), so nothing is cut
            ('hero-top', 'hero.jpg', 0.0, 0.56, 'bottom', 0.16, 1080),
            ('hero-bottom', 'hero.jpg', 0.6, 1.0, 'top', 0.2, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (34, 69, 184), 880, (26, 64), 2, False),
            ('corner-tl', 'corner-tl.jpg', (37, 73, 187), 720, (26, 64), 2, False),
        ],
        'sprites': ('petals-sheet.jpg', (39, 72, 188), 'petal', 96, (26, 64), (3, 3, 2, 2, 1, 2), False),
        'texture': ('texture.jpg', 512, 70),
    },
    'bugis': {
        # Cut-outs on cobalt (~#2144B8 delivered). No blues in the palette -> despill.
        'despill': True,
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: centre clear ~29-86 %; side tassels reach ~32 %, side bosara from ~73 %.
        'bands': [
            ('hero-top', 'hero.jpg', 0.0, 0.42, 'bottom', 0.2, 1080),
            ('hero-bottom', 'hero.jpg', 0.66, 1.0, 'top', 0.22, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (30, 67, 184), 880, (26, 64), 2, False),
            # the corner's blue darkens below ~80 % (not flat): cut the art above it
            ('corner-tl', 'corner-tl.jpg', (33, 68, 184), 720, (26, 64), 2, False, (0, 0, 1, 0.8)),
        ],
        'sprites': ('petals-sheet.jpg', (37, 72, 188), 'petal', 96, (26, 64), (2, 3, 3, 3, 2, 2), False),
        # Gemini wouldn't paint this one; generated to match the paintings' silk.
        'texture_synth': {'size': 512, 'rgb': (18, 80, 57), 'grain': 2.2, 'weave': 1.6, 'mottle': 3.0},
    },
    'minang': {
        # Cut-outs on cobalt (~#2242B8, even this time: no crop needed); no blues -> despill.
        'despill': True,
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: centre clear ~30-84 %; the side drapes reach ~40 %, the runner starts ~81 %.
        'bands': [
            ('hero-top', 'hero.jpg', 0.0, 0.46, 'bottom', 0.16, 1080),
            ('hero-bottom', 'hero.jpg', 0.74, 1.0, 'top', 0.22, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (34, 66, 184), 880, (26, 64), 2, False),
            ('corner-tl', 'corner-tl.jpg', (34, 66, 185), 720, (26, 64), 2, False),
        ],
        'sprites': ('petals-sheet.jpg', (39, 71, 187), 'petal', 96, (26, 64), (2, 3, 3, 3, 2, 2), False),
        # The painted lacquer (texture.jpg) has strong vertical grain that tiles
        # visibly at 256 px; a generated lacquer (no weave) matches the paintings.
        'texture_synth': {'size': 512, 'rgb': (20, 12, 10), 'grain': 1.4, 'weave': 0, 'mottle': 1.6},
    },
}

QUALITY = {'avif': 52, 'webp': 78, 'jpg': 82}


def save_all(img, out, name, formats):
    paths = []
    for fmt in formats:
        p = out / f'{name}.{fmt}'
        if fmt == 'jpg':
            img.convert('RGB').save(p, 'JPEG', quality=QUALITY['jpg'], optimize=True, progressive=True)
        elif fmt == 'webp':
            img.save(p, 'WEBP', quality=QUALITY['webp'], method=6)
        else:
            img.save(p, 'AVIF', quality=QUALITY['avif'])
        paths.append(p)
    return paths


def resize_w(img, width):
    if img.width <= width:
        return img
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def key(img, bg, ramp, close, fill=False, despill=False):
    """RGBA cut-out of `img` from a flat background colour `bg`. `despill`
    (blue-screen art): cap blue at max(red, green), removing the background's
    tint from translucent watercolour. Only for palettes with no true blues."""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    bg = np.array(bg, np.float32)
    dist = np.sqrt(((a - bg) ** 2).sum(2))
    lo, hi = ramp
    alpha = np.clip((dist - lo) / (hi - lo), 0, 1)
    if close:
        solid = ndi.binary_closing(alpha > 0.5, iterations=close)
        if fill:   # dark petals enclosed by brighter edges are flower, not background
            solid = ndi.binary_fill_holes(solid)
        solid = ndi.binary_erosion(solid, iterations=1)   # keep the soft edge from the ramp
        alpha = np.maximum(alpha, solid.astype(np.float32))
    alpha = ndi.gaussian_filter(alpha, 0.6)
    # Unmix: observed = alpha*fg + (1-alpha)*bg  ->  fg = (observed - (1-alpha)*bg) / alpha
    safe = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((a - (1 - alpha[..., None]) * bg) / safe, 0, 255)
    if despill:
        fg[..., 2] = np.minimum(fg[..., 2], np.maximum(fg[..., 0], fg[..., 1]))
    fg = np.where(alpha[..., None] > 0.02, fg, 0)
    rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba)


def trim(img, pad=8):
    box = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        return img
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def seamless(img, size):
    """A tile that repeats without seams: the centre of the image, blended
    towards a half-offset copy (whose edges wrap continuously) near the edges."""
    s = min(img.size)
    a = np.asarray(img.convert('RGB').crop((0, 0, s, s)).resize((size, size), Image.LANCZOS)).astype(np.float32)
    b = np.roll(a, (size // 2, size // 2), (0, 1))
    y, x = np.mgrid[0:size, 0:size] / (size - 1) * 2 - 1
    edge = np.clip((np.maximum(abs(x), abs(y)) - 0.55) / 0.4, 0, 1)[..., None]
    return Image.fromarray((a * (1 - edge) + b * edge).astype(np.uint8))


def synth_texture(size, rgb, grain, weave, mottle, seed=7):
    """A seamless fabric tile when no painted texture exists: fine grain, a faint
    over/under weave and soft mottling, all periodic in the tile (wrap-mode
    blurs, weave periods that divide the size), so it repeats without seams."""
    rng = np.random.default_rng(seed)
    fine = ndi.gaussian_filter(rng.standard_normal((size, size)), 0.6, mode='wrap')
    soft = ndi.gaussian_filter(rng.standard_normal((size, size)), 24, mode='wrap')
    soft /= soft.std() or 1
    y, x = np.mgrid[0:size, 0:size]
    cloth = np.sin(2 * np.pi * x / 4) * np.sin(2 * np.pi * y / 4)
    lum = grain * fine / (fine.std() or 1) + weave * cloth + mottle * soft
    tile = np.clip(np.array(rgb, np.float32)[None, None, :] + lum[..., None] * np.array([0.6, 1.0, 0.8]), 0, 255)
    return Image.fromarray(tile.astype(np.uint8))


def build(pack):
    cfg = PACKS[pack]
    src = ROOT / 'design' / 'packs' / pack / 'masters'
    out = ROOT / 'frontend' / 'src' / 'themes' / 'packs' / pack / 'assets'
    out.mkdir(parents=True, exist_ok=True)
    written = []

    for name, master, width, formats in cfg.get('opaque', []):
        img = resize_w(Image.open(src / master).convert('RGB'), width)
        written += save_all(img, out, name, formats)

    for name, master, y0, y1, edge, fade, width in cfg.get('bands', []):
        img = Image.open(src / master).convert('RGB')
        band = resize_w(img.crop((0, round(y0 * img.height), img.width, round(y1 * img.height))), width)
        h = band.height
        ramp = np.clip(np.arange(h) / (fade * h), 0, 1) if edge == 'top' else np.clip((h - 1 - np.arange(h)) / (fade * h), 0, 1)
        ramp = ramp * ramp * (3 - 2 * ramp)   # smoothstep: no visible edge where the fade starts
        alpha = np.repeat((ramp * 255).astype(np.uint8)[:, None], band.width, 1)
        band.putalpha(Image.fromarray(alpha))
        written += save_all(band, out, name, ('avif', 'webp'))

    for name, master, bg, width, ramp, close, fill, *crop in cfg.get('keyed', []):
        raw = Image.open(src / master)
        if crop:   # (x0, y0, x1, y1) fractions: drop parts of the canvas that aren't flat background
            x0, y0, x1, y1 = crop[0]
            raw = raw.crop((round(x0 * raw.width), round(y0 * raw.height), round(x1 * raw.width), round(y1 * raw.height)))
        img = resize_w(key(raw, bg, ramp, close, fill, cfg.get('despill', False)), width)
        written += save_all(img, out, name, ('avif', 'webp'))

    if 'sprites' in cfg:
        master, bg, prefix, size, ramp, closes, *rest = cfg['sprites']
        fill = rest[0] if rest else True
        sheet = key(Image.open(src / master), bg, ramp, 6, fill=True)   # only to find the sprites' boxes
        # The sheet is painted as a 3x2 grid: one sprite per cell, even when a
        # sprite is several separate pieces (rice grains). Rows and columns are
        # split at the widest empty gaps between pieces (not at fixed thirds:
        # a sprite can sit across the sheet's midline), then pieces are grouped
        # per cell, in reading order.
        lab, n = ndi.label(np.asarray(sheet.getchannel('A')) > 40)
        parts = [b for b in ndi.find_objects(lab) if (b[0].stop - b[0].start) * (b[1].stop - b[1].start) >= 400]

        def splits(spans, k):
            # k-1 cut positions at the widest gaps of the union of 1-D spans
            spans = sorted(spans)
            gaps, reach = [], spans[0][1]
            for a, b in spans[1:]:
                if a > reach:
                    gaps.append((a - reach, (a + reach) / 2))
                reach = max(reach, b)
            return sorted(pos for _, pos in sorted(gaps, reverse=True)[:k - 1])

        rows = splits([(b[0].start, b[0].stop) for b in parts], 2)
        cols = splits([(b[1].start, b[1].stop) for b in parts], 3)
        cells = {}
        for b in parts:
            cy, cx = (b[0].start + b[0].stop) / 2, (b[1].start + b[1].stop) / 2
            cell = (sum(cy > r for r in rows), sum(cx > c for c in cols))
            y0, y1, x0, x1 = cells.get(cell, (b[0].start, b[0].stop, b[1].start, b[1].stop))
            cells[cell] = (min(y0, b[0].start), max(y1, b[0].stop), min(x0, b[1].start), max(x1, b[1].stop))
        boxes = [(slice(y0, y1), slice(x0, x1)) for _, (y0, y1, x0, x1) in sorted(cells.items())]
        raw = Image.open(src / master)
        for i, (ys, xs) in enumerate(boxes, 1):
            # Re-key each sprite alone: a petal is one solid shape, and its darkest
            # streaks can reach its edge (so they aren't enclosed holes) yet must
            # not become see-through.
            pad = 40
            crop = (max(0, xs.start - pad), max(0, ys.start - pad), min(raw.width, xs.stop + pad), min(raw.height, ys.stop + pad))
            sprite = trim(key(raw.crop(crop), bg, ramp, closes[i - 1], fill=fill, despill=cfg.get('despill', False)))
            sprite.thumbnail((size, size), Image.LANCZOS)
            written += save_all(sprite, out, f'{prefix}-{i}', ('webp',))

    if 'texture' in cfg:
        master, size, q = cfg['texture']
        tile = seamless(Image.open(src / master), size)
        p = out / 'texture.webp'
        tile.save(p, 'WEBP', quality=q, method=6)
        written.append(p)

    if 'texture_synth' in cfg:
        p = out / 'texture.webp'
        synth_texture(**cfg['texture_synth']).save(p, 'WEBP', quality=72, method=6)
        written.append(p)

    for p in written:
        with Image.open(p) as im:
            print(f'{p.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {p.stat().st_size // 1024} KB')


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'floral')
