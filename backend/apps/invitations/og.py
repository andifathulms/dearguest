"""Link-preview images (1200x630 JPEG) drawn on each pack's painted template.

What goes into the image comes only from the invitation and, for personal
links, the guest list: never from the URL. `?to=` is not read anywhere here.

The image URL carries a content hash (`/og/<slug>/<hash>.jpg`), so editing the
names, date, theme or variant gives a new URL and WhatsApp fetches a fresh
preview instead of its cached one. Assets live in og_assets/ (generated from
the packs by scripts/sync_themes.py)."""
import hashlib
import io
import json
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

from django.conf import settings
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .copy import event_label, t

ASSETS = Path(__file__).resolve().parent / 'og_assets'
SIZE = (1200, 630)
MAX_BYTES = 300 * 1024
# Bump when the drawing changes, so every preview URL changes with it.
LAYOUT_VERSION = 1

GENERIC = {'box': [150, 90, 1050, 540], 'ink': '#3d4741', 'accent': '#8a6f3e', 'shadow': False,
           'background': '#f6f1e8'}
TZ_LABEL = {'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT'}
DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
          'Agustus', 'September', 'Oktober', 'November', 'Desember']

# Font sizes (px) per line: (largest, smallest). Names shrink first, then wrap.
NAMES_SIZE = (120, 44)
# Below this a long pair reads better on two lines than squeezed onto one.
ONE_LINE_MIN = 80
LABEL_SIZE = (26, 18)
TEXT_SIZE = (30, 20)
GUEST_SIZE = (40, 24)
GAP = 18


# ---- what the preview says -------------------------------------------------

def primary_event(invitation):
    events = list(invitation.events.all())
    return next((e for e in events if e.is_primary), None) or (min(events, key=lambda e: e.start) if events else None)


def date_text(event):
    """'Sabtu, 14 Desember 2026'. In the event's own zone, so a late-evening
    WIT event doesn't show the previous day."""
    local = event.start.astimezone(ZoneInfo(event.timezone))
    return f"{DAYS[local.weekday()]}, {local.day} {MONTHS[local.month - 1]} {local.year}"


def event_line(event, variant):
    local = event.start.astimezone(ZoneInfo(event.timezone))
    label = event_label(event.event_type, variant, event.title)
    zone = TZ_LABEL.get(event.timezone, event.timezone)
    return f"{label} · {local:%H.%M} {zone}"


def preview_data(invitation, guest=None):
    """Everything drawn into the image, and therefore everything the hash covers."""
    variant = invitation.copy_variant
    couple = getattr(invitation, 'couple', None)
    event = primary_event(invitation)
    return {
        'v': LAYOUT_VERSION,
        'pack': invitation.theme,
        'art': _pack_fingerprint(invitation.theme),
        'variant': variant,
        'label': t('og.label', variant),
        'bride': (couple.bride_name if couple else '').strip(),
        'groom': (couple.groom_name if couple else '').strip(),
        'date': date_text(event) if event else '',
        'event': event_line(event, variant) if event else '',
        'to': t('og.to', variant) if guest else '',
        'guest': guest.name.strip() if guest else '',
    }


def preview_hash(data):
    raw = json.dumps(data, sort_keys=True, ensure_ascii=False).encode('utf-8')
    return hashlib.sha256(raw).hexdigest()[:16]


def names_text(data):
    return ' & '.join(n for n in (data['bride'], data['groom']) if n)


# ---- assets ----------------------------------------------------------------

def _pack_dir(pack):
    if not pack:
        return None
    d = ASSETS / pack
    return d if (d / 'og.json').is_file() else None


@lru_cache(maxsize=None)
def _pack_fingerprint(pack):
    """Changes when a pack's art or layout is rebuilt."""
    d = _pack_dir(pack)
    if not d:
        return 'generic'
    h = hashlib.sha256()
    for f in sorted(d.iterdir()):
        h.update(f.name.encode())
        h.update(f.read_bytes())
    return h.hexdigest()[:12]


@lru_cache(maxsize=None)
def _layout(pack):
    d = _pack_dir(pack)
    return json.loads((d / 'og.json').read_text(encoding='utf-8')) if d else GENERIC


@lru_cache(maxsize=None)
def _font(pack, role, size):
    d = _pack_dir(pack) or ASSETS / '_generic'
    return ImageFont.truetype(str(d / f'{role}.woff2'), size, layout_engine=ImageFont.Layout.RAQM)


def _background(pack):
    d = _pack_dir(pack)
    if d:
        return Image.open(d / 'template.jpg').convert('RGB')
    return Image.new('RGB', SIZE, GENERIC['background'])


# ---- fitting ---------------------------------------------------------------

def _width(font, text, tracking=0):
    return font.getlength(text) + tracking * max(len(text) - 1, 0)


def _ellipsize(font, text, max_w, tracking=0):
    if _width(font, text, tracking) <= max_w:
        return text
    while text and _width(font, text + '…', tracking) > max_w:
        text = text[:-1]
    return text.rstrip() + '…'


def _fit_line(pack, role, text, max_w, sizes, tracking=0.0):
    """Largest size at which `text` fits on one line; at the smallest size the
    text is cut with an ellipsis rather than ever overflowing."""
    hi, lo = sizes
    for size in range(hi, lo - 1, -2):
        font = _font(pack, role, size)
        if _width(font, text, tracking * size) <= max_w:
            return font, [text]
    font = _font(pack, role, lo)
    return font, [_ellipsize(font, text, max_w, tracking * lo)]


def _fit_names(pack, data, max_w, hi):
    """One line if it fits at a readable size; otherwise 'Bride' / '& Groom'
    on two lines; ellipsis only as the last resort. `hi` is lowered by render()
    until the whole block also fits the box's height."""
    text = names_text(data)
    lo = NAMES_SIZE[1]
    one_line_floor = min(hi, ONE_LINE_MIN)
    for size in range(hi, one_line_floor - 1, -4):
        font = _font(pack, 'names', size)
        if _width(font, text) <= max_w:
            return font, [text]
    if data['bride'] and data['groom']:
        lines = [data['bride'], f"& {data['groom']}"]
        for size in range(hi, lo - 1, -4):
            font = _font(pack, 'names', size)
            if all(_width(font, line) <= max_w for line in lines):
                return font, lines
        font = _font(pack, 'names', lo)
        return font, [_ellipsize(font, line, max_w) for line in lines]
    return _fit_line(pack, 'names', text, max_w, (one_line_floor, lo))


# ---- drawing ---------------------------------------------------------------

def _line_height(font):
    ascent, descent = font.getmetrics()
    return ascent + descent


def _blocks(pack, data, max_w, names_hi):
    """(font, lines, colour key, tracking) for each block, top to bottom."""
    blocks = []
    label_font, label = _fit_line(pack, 'label', data['label'].upper(), max_w, LABEL_SIZE, tracking=0.18)
    blocks.append((label_font, label, 'accent', 0.18))
    if names_text(data):
        names_font, names = _fit_names(pack, data, max_w, names_hi)
        blocks.append((names_font, names, 'ink', 0))
    for key in ('date', 'event'):
        if data[key]:
            font, lines = _fit_line(pack, 'text', data[key], max_w, TEXT_SIZE)
            blocks.append((font, lines, 'ink', 0))
    if data['guest']:
        font, lines = _fit_line(pack, 'label', data['to'].upper(), max_w, LABEL_SIZE, tracking=0.14)
        blocks.append((font, lines, 'accent', 0.14))
        font, lines = _fit_line(pack, 'text', data['guest'], max_w, GUEST_SIZE)
        blocks.append((font, lines, 'ink', 0))
    return blocks


def _draw_text(draw, xy, text, font, fill, tracking):
    if not tracking:
        draw.text(xy, text, font=font, fill=fill)
        return
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking


def render(data):
    """JPEG bytes for the preview described by `data` (see preview_data)."""
    pack = data['pack'] if _pack_dir(data['pack']) else None
    layout = _layout(pack) if pack else GENERIC
    x0, y0, x1, y1 = layout['box']
    max_w = x1 - x0
    for names_hi in range(NAMES_SIZE[0], NAMES_SIZE[1] - 1, -8):
        blocks = _blocks(pack, data, max_w, names_hi)
        heights = [len(lines) * _line_height(font) for font, lines, _, _ in blocks]
        total = sum(heights) + GAP * (len(blocks) - 1)
        if total <= y1 - y0:
            break
    y = y0 + max((y1 - y0 - total) // 2, 0)

    text_layer = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_layer)
    for (font, lines, colour, tracking), h in zip(blocks, heights):
        line_h = _line_height(font)
        for line in lines:
            w = _width(font, line, tracking * font.size)
            _draw_text(draw, (x0 + (max_w - w) / 2, y), line, font, layout[colour], tracking * font.size)
            y += line_h
        y += GAP

    image = _background(pack).convert('RGBA')
    if layout.get('shadow'):
        # Light ink on dark art: a soft dark glow keeps it readable over detail.
        alpha = text_layer.getchannel('A').filter(ImageFilter.GaussianBlur(6))
        shadow = Image.new('RGBA', SIZE, (0, 0, 0, 0))
        shadow.putalpha(alpha.point(lambda a: int(a * 0.55)))
        image = Image.alpha_composite(image, shadow)
    image = Image.alpha_composite(image, text_layer).convert('RGB')

    for quality in (86, 80, 74, 68, 60):
        out = io.BytesIO()
        image.save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
        if out.tell() <= MAX_BYTES:
            break
    return out.getvalue()


# ---- storage ---------------------------------------------------------------

def image_path(slug, code, digest):
    parts = [slug] + ([code] if code else [])
    return '/'.join(['og', *parts, f'{digest}.jpg'])


def image_url(slug, code, digest):
    return f"{settings.FRONTEND_URL}/{image_path(slug, code, digest)}"


def ensure_rendered(slug, code, data, digest):
    """The file for this preview, rendered on first request. Older renders for
    the same link are removed: their URLs redirect to the current one."""
    path = Path(settings.MEDIA_ROOT) / image_path(slug, code, digest)
    if not path.is_file():
        path.parent.mkdir(parents=True, exist_ok=True)
        for stale in path.parent.glob('*.jpg'):
            stale.unlink(missing_ok=True)
        tmp = path.with_suffix('.tmp')
        tmp.write_bytes(render(data))
        tmp.replace(path)
    return path
