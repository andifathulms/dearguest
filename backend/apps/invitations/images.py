"""Image processing for every upload (editor, admin, seed, code): it runs from
uploads._SafeNameMixin.save, the one step all write paths share.

* The stored original is re-encoded upright (EXIF orientation applied) with
  no metadata at all -- phone photos carry GPS coordinates in EXIF.
* Originals larger than MAX_EDGE are scaled down; nothing is ever upscaled.
* Responsive fields also get WebP renditions at RENDITION_WIDTHS (only those
  narrower than the original), recorded in ProcessedImage for srcset. The
  original stays the JPEG/PNG fallback.
"""
import io
from pathlib import PurePosixPath

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

MAX_EDGE = 2560
RENDITION_WIDTHS = (480, 960, 1600)
JPEG_QUALITY = 86
WEBP_QUALITY = 80

_FORMATS = {'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WEBP'}


def _open_upright(content):
    content.seek(0)
    img = Image.open(content)
    img.load()
    img = ImageOps.exif_transpose(img)   # also drops the orientation tag
    if img.mode not in ('RGB', 'RGBA', 'L', 'LA'):
        img = img.convert('RGBA' if 'A' in img.getbands() or 'transparency' in img.info else 'RGB')
    return img


def _encode(img, fmt):
    """Encode without carrying over any metadata (no exif=, icc kept for colour)."""
    buf = io.BytesIO()
    icc = img.info.get('icc_profile')
    extra = {'icc_profile': icc} if icc else {}
    if fmt == 'JPEG':
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.save(buf, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True, **extra)
    elif fmt == 'PNG':
        img.save(buf, 'PNG', optimize=True, **extra)
    else:
        img.save(buf, 'WEBP', quality=WEBP_QUALITY, method=4, **extra)
    return buf.getvalue()


def _fit(img, max_width=None, max_edge=None):
    w, h = img.size
    scale = 1.0
    if max_width and w > max_width:
        scale = max_width / w
    if max_edge and max(w, h) * scale > max_edge:
        scale = max_edge / max(w, h)
    if scale >= 1.0:
        return img
    return img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def clean_original(content, mime):
    """(ContentFile, width, height) for the stored original: upright, no
    metadata, at most MAX_EDGE on the long side, in the uploaded format."""
    img = _fit(_open_upright(content), max_edge=MAX_EDGE)
    return ContentFile(_encode(img, _FORMATS[mime])), img, img.size


def write_renditions(storage, name, img):
    """Save WebP renditions next to `name`; return {width: storage name}."""
    stem = PurePosixPath(name)
    variants = {}
    for width in RENDITION_WIDTHS:
        if width >= img.size[0]:
            break
        small = _fit(img, max_width=width)
        target = str(stem.with_name(f'{stem.stem}-w{width}.webp'))
        # Names derive from the (unique) original, so an existing file here is a
        # stale rendition of this same image: replace it rather than suffixing.
        if storage.exists(target):
            storage.delete(target)
        variants[str(width)] = storage.save(target, ContentFile(_encode(small, 'WEBP')))
    return variants


def record(name, size, variants):
    from .models import ProcessedImage
    ProcessedImage.objects.update_or_create(
        name=name, defaults={'width': size[0], 'height': size[1], 'variants': variants})


def has_exif(storage, name):
    """True when the stored file still carries EXIF/XMP metadata (backfill report)."""
    with storage.open(name) as f:
        img = Image.open(f)
        return bool(img.info.get('exif') or img.info.get('xmp') or img.getexif())


def process_stored(storage, name, responsive):
    """Backfill: clean an already-stored file in place and (re)build renditions."""
    from .uploads import sniff_file
    with storage.open(name) as f:
        data = io.BytesIO(f.read())
    mime = sniff_file(data)
    if mime not in _FORMATS:
        return None
    cleaned, img, size = clean_original(data, mime)
    storage.delete(name)
    saved = storage.save(name, cleaned)   # same name: the directory entry was just freed
    variants = write_renditions(storage, saved, img) if responsive else {}
    record(saved, size, variants)
    return saved
