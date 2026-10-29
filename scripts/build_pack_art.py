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
    'sunda': {
        # Cut-outs on magenta (#D01C8B asked; ~#CA1885 delivered): the mega mendung clouds
        # are indigo, so blue can't be keyed or despilled. Magenta despill instead.
        # No hole filling: the ring's opening and the melati loops must stay open.
        'despill': 'magenta',
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: centre clear ~37-80 % (the middle melati swag ends ~37 %); the side
        # melati strings reach ~43 %, the side bamboo rises from ~55 %.
        'bands': [
            ('hero-top', 'hero.jpg', 0.0, 0.48, 'bottom', 0.1, 1080),
            ('hero-bottom', 'hero.jpg', 0.53, 1.0, 'top', 0.12, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (200, 24, 134), 880, (26, 64), 2, False),
            ('corner-tl', 'corner-tl.jpg', (205, 23, 133), 720, (26, 64), 2, False),
        ],
        # the sheet's lower 45 % is a painted mist, not flat magenta: the sprites end ~55 %
        'sprites': ('petals-sheet.jpg', (203, 31, 133), 'petal', 96, (26, 64), (2, 3, 2, 3, 2, 2), False),
        'sprites_crop': (0, 0, 1, 0.57),
        'texture': ('texture.jpg', 512, 70),
    },
    'rustic': {
        # Cut-outs on cobalt (~#2344BD delivered); the palette has no blues -> despill.
        # No hole filling: the wreath's opening and the gaps in the pampas must stay open.
        # Edge fill: the pampas hairs unmix to a dark fringe; recolour them from the plume.
        'despill': True,
        'edge_fill': True,
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: centre clear ~24-78 % (the swag and bow end ~24 %); the side pampas
        # reach ~38 % (top) and rise from ~62 % (bottom).
        'bands': [
            ('hero-top', 'hero.jpg', 0.0, 0.42, 'bottom', 0.12, 1080),
            ('hero-bottom', 'hero.jpg', 0.58, 1.0, 'top', 0.14, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (35, 68, 191), 880, (26, 64), 2, False),
            ('corner-tl', 'corner-tl.jpg', (36, 67, 185), 720, (26, 64), 2, False),
        ],
        # Patches of the key that Gemini smudged (x0, y0, x1, y1 fractions), painted
        # back to flat key before cutting: the corner's lower right is a faint blur.
        'clear': {'corner-tl': [(0.4, 0.74, 1, 1)]},
        # the sheet's lower third is a painted haze, not flat cobalt: the sprites end ~60 %
        'sprites': ('petals-sheet.jpg', (38, 69, 189), 'petal', 96, (26, 64), (2, 2, 3, 3, 2, 2), False),
        'sprites_crop': (0, 0, 1, 0.66),
        'texture': ('texture.jpg', 512, 70),
        # the painted kraft is yellower than the paintings' paper (~#E9D5BB): match it
        'texture_tint': (233, 213, 187),
    },
    'batak': {
        # Cut-outs on cobalt (~#2546BE delivered). The ornament has no blues -> despill, and
        # edge_fill keeps the ulos fringe threads free of a cobalt outline.
        'despill': True,
        'edge_fill': True,
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: centre clear ~32-75 % (the ulos fringe hangs to ~31 %, deeper than asked);
        # the runner, tandok and leaves start ~75 %.
        'bands': [
            ('hero-top', 'hero.jpg', 0.0, 0.36, 'bottom', 0.1, 1080),
            ('hero-bottom', 'hero.jpg', 0.72, 1.0, 'top', 0.12, 1080),
            # Prompt 8's far layer: the lake came as a strip at ~68-83 % on cobalt (not the
            # bottom 30 % asked), its haze a gradient out of the key. Cut below the gradient
            # (~74.5 %) to the lake's straight lower edge (~82.6 %) and fade both edges, so it
            # can rise out from behind the runner as the hero scrolls (overrides.css).
            ('parallax-back', 'parallax-back.jpg', 0.745, 0.826, 'both', 0.4, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (38, 70, 191), 880, (26, 64), 2, False),
            ('corner-tl', 'corner-tl.jpg', (33, 68, 186), 720, (26, 64), 2, False),
            # Prompt 8's near layer: fig leaves and ulos fringe at the side edges.
            ('parallax-front', 'parallax-front.jpg', (38, 69, 192), 1080, (26, 64), 2, False),
        ],
        # the sheet's lower third is a painted haze again: the sprites end ~62 %
        'sprites': ('petals-sheet.jpg', (37, 69, 190), 'petal', 96, (26, 64), (2, 3, 2, 2, 2, 2), False),
        'sprites_crop': (0, 0, 1, 0.63),
        'texture': ('texture.jpg', 512, 70),
    },
    'lavender': {
        # Cut-outs on orange (#F08A00 asked; ~#EA7E00 delivered): lilac and violet carry
        # more blue than red, so a blue key's despill would grey them. No despill at all;
        # edge_fill recolours the soft edge from the petals instead.
        'edge_fill': True,
        'opaque': [
            ('cover-bg', 'cover-bg-portrait.jpg', 1080, ('avif', 'webp', 'jpg')),
            ('cover-bg-desktop', 'cover-bg-desktop.jpg', 1920, ('avif', 'webp', 'jpg')),
        ],
        # hero.jpg: the centre racemes end ~31 %, the side ones ~46 %; the lavender bed
        # rises from ~68 % at the sides, ~80 % in the centre.
        'bands': [
            ('hero-top', 'hero.jpg', 0.0, 0.5, 'bottom', 0.08, 1080),
            ('hero-bottom', 'hero.jpg', 0.64, 1.0, 'top', 0.12, 1080),
        ],
        'keyed': [
            ('photo-ring', 'photo-ring.jpg', (234, 126, 0), 880, (26, 64), 2, False),
            ('corner-tl', 'corner-tl.jpg', (230, 128, 4), 720, (26, 64), 2, False),
            # Prompt 8. The far field came mid-frame again (~62.5-79 %), but with a clean top
            # outline, so it is a cut-out; faint ghost racemes above ~55 % are cropped off,
            # and overrides.css fades its straight lower edge.
            ('parallax-back', 'parallax-back.jpg', (234, 126, 0), 1080, (26, 64), 2, False, (0, 0.58, 1, 0.795)),
            ('parallax-front', 'parallax-front.jpg', (236, 129, 0), 1080, (26, 64), 2, False),
        ],
        'sprites': ('petals-sheet.jpg', (230, 124, 1), 'petal', 96, (26, 64), (2, 2, 3, 2, 2, 2), False),
        'texture': ('texture.jpg', 512, 70),
        # the painted paper is a touch greyer than the paintings' (~#FDF8FD)
        'texture_tint': (253, 248, 253),
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


def key(img, bg, ramp, close, fill=False, despill=False, edge_fill=False):
    """RGBA cut-out of `img` from a flat background colour `bg`. `despill`
    (blue-screen art): cap blue at max(red, green), removing the background's
    tint from translucent watercolour. Only for palettes with no true blues.
    `despill='magenta'`: in the soft edge, where both red and blue exceed green,
    pull them down by the excess (for palettes with indigo, where blue can't be capped).
    `edge_fill`: the soft edge takes the colour of the nearest solid pixel (only its
    alpha is kept), for feathery art (pampas) whose hairs unmix to a dark fringe; with
    blue despill it also fades strokes that are clearly bluer than red or green, and with
    any other key, strokes whose colour leans towards the key's hue."""
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
    if edge_fill and despill is True:
        # Blue-screen art with no blues of its own: strokes clearly bluer than they are
        # red or green are key mixed into the paint (painted hair tips), so they fade.
        spill = a[..., 2] - np.maximum(a[..., 0], a[..., 1])
        alpha = np.minimum(alpha, np.clip(1 - (spill - 8) / 40, 0, 1))
    elif edge_fill:
        # Any other key (orange): strokes whose colour leans towards the key's hue are
        # key anti-aliased into the paint (outlines along a silhouette), so they fade.
        k = bg - bg.mean()
        spill = ((a - a.mean(2, keepdims=True)) * (k / np.linalg.norm(k))).sum(2)
        alpha = np.minimum(alpha, np.clip(1 - (spill - 14) / 40, 0, 1))
    alpha = ndi.gaussian_filter(alpha, 0.6)
    # Unmix: observed = alpha*fg + (1-alpha)*bg  ->  fg = (observed - (1-alpha)*bg) / alpha
    safe = np.maximum(alpha, 1e-3)[..., None]
    fg = np.clip((a - (1 - alpha[..., None]) * bg) / safe, 0, 255)
    if despill == 'magenta':   # edges only: the art's own pinks are solid, so they keep their colour
        excess = np.maximum(np.minimum(fg[..., 0], fg[..., 2]) - fg[..., 1], 0) * (alpha < 0.995)
        fg[..., 0] -= excess
        fg[..., 2] -= excess
    elif despill:
        fg[..., 2] = np.minimum(fg[..., 2], np.maximum(fg[..., 0], fg[..., 1]))
    if edge_fill:
        solid = alpha >= 0.95
        if solid.any():
            _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
            fg = np.where(solid[..., None], fg, fg[iy, ix])
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


OG_SIZE = (1200, 630)


def make_og_template(src, out):
    """The base of the pack's WhatsApp/Facebook link preview (og.py draws the
    names on it): the desktop cover painting, centre-cropped to 1200x630. Its
    calm centre is where the text goes (theme.json -> og.box)."""
    master = src / 'cover-bg-desktop.jpg'
    if not master.exists():
        return []
    img = Image.open(master).convert('RGB')
    w, h = img.size
    target = OG_SIZE[0] / OG_SIZE[1]
    if w / h > target:   # too wide: trim the sides equally
        cw = round(h * target)
        img = img.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h))
    else:                # too tall: trim top and bottom equally
        ch = round(w / target)
        img = img.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch))
    img = img.resize(OG_SIZE, Image.LANCZOS)
    p = out / 'og-template.jpg'
    img.save(p, 'JPEG', quality=84, optimize=True, progressive=True)
    return [p]


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
        from_top = np.clip(np.arange(h) / (fade * h), 0, 1)
        from_bottom = np.clip((h - 1 - np.arange(h)) / (fade * h), 0, 1)
        # 'both': a free-floating strip (a depth layer) fades at both edges
        ramp = {'top': from_top, 'bottom': from_bottom, 'both': np.minimum(from_top, from_bottom)}[edge]
        ramp = ramp * ramp * (3 - 2 * ramp)   # smoothstep: no visible edge where the fade starts
        alpha = np.repeat((ramp * 255).astype(np.uint8)[:, None], band.width, 1)
        band.putalpha(Image.fromarray(alpha))
        written += save_all(band, out, name, ('avif', 'webp'))

    for name, master, bg, width, ramp, close, fill, *crop in cfg.get('keyed', []):
        raw = Image.open(src / master).convert('RGB')
        for x0, y0, x1, y1 in cfg.get('clear', {}).get(name, []):
            raw.paste(tuple(bg), (round(x0 * raw.width), round(y0 * raw.height), round(x1 * raw.width), round(y1 * raw.height)))
        if crop:   # (x0, y0, x1, y1) fractions: drop parts of the canvas that aren't flat background
            x0, y0, x1, y1 = crop[0]
            raw = raw.crop((round(x0 * raw.width), round(y0 * raw.height), round(x1 * raw.width), round(y1 * raw.height)))
        img = resize_w(key(raw, bg, ramp, close, fill, cfg.get('despill', False), cfg.get('edge_fill', False)), width)
        written += save_all(img, out, name, ('avif', 'webp'))

    if 'sprites' in cfg:
        master, bg, prefix, size, ramp, closes, *rest = cfg['sprites']
        fill = rest[0] if rest else True
        raw = Image.open(src / master)
        if 'sprites_crop' in cfg:   # (x0, y0, x1, y1) fractions: keep only the flat-background part
            x0, y0, x1, y1 = cfg['sprites_crop']
            raw = raw.crop((round(x0 * raw.width), round(y0 * raw.height), round(x1 * raw.width), round(y1 * raw.height)))
        sheet = key(raw, bg, ramp, 6, fill=True)   # only to find the sprites' boxes
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
        for i, (ys, xs) in enumerate(boxes, 1):
            # Re-key each sprite alone: a petal is one solid shape, and its darkest
            # streaks can reach its edge (so they aren't enclosed holes) yet must
            # not become see-through.
            pad = 40
            crop = (max(0, xs.start - pad), max(0, ys.start - pad), min(raw.width, xs.stop + pad), min(raw.height, ys.stop + pad))
            sprite = trim(key(raw.crop(crop), bg, ramp, closes[i - 1], fill=fill, despill=cfg.get('despill', False), edge_fill=cfg.get('edge_fill', False)))
            sprite.thumbnail((size, size), Image.LANCZOS)
            written += save_all(sprite, out, f'{prefix}-{i}', ('webp',))

    if 'texture' in cfg:
        master, size, q = cfg['texture']
        tile = seamless(Image.open(src / master), size)
        if 'texture_tint' in cfg:   # shift the tile's average to the paintings' paper, keeping its fibres
            arr = np.asarray(tile).astype(np.float32)
            arr += np.array(cfg['texture_tint'], np.float32) - arr.reshape(-1, 3).mean(0)
            tile = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        p = out / 'texture.webp'
        tile.save(p, 'WEBP', quality=q, method=6)
        written.append(p)

    written += make_og_template(src, out)

    if 'texture_synth' in cfg:
        p = out / 'texture.webp'
        synth_texture(**cfg['texture_synth']).save(p, 'WEBP', quality=72, method=6)
        written.append(p)

    for p in written:
        with Image.open(p) as im:
            print(f'{p.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {p.stat().st_size // 1024} KB')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['--og-only']:   # just the link-preview bases, for the given (or all) packs
        for pack in args[1:] or list(PACKS):
            for p in make_og_template(ROOT / 'design' / 'packs' / pack / 'masters',
                                      ROOT / 'frontend' / 'src' / 'themes' / 'packs' / pack / 'assets'):
                print(f'{p.relative_to(ROOT)}  {p.stat().st_size // 1024} KB')
    else:
        build(args[0] if args else 'floral')
