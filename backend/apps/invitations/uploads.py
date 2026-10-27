"""Content-based validation and naming for user uploads.

Uploads are served back from /media/, so the type is decided from the file's
own bytes (magic numbers) -- never from the client's filename or MIME type --
and the stored extension is derived from that sniffed type. A file can't be
uploaded as `song.mp3` and land on disk as something a browser would run.
"""
import secrets
from pathlib import Path

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.fields.files import FieldFile, ImageFieldFile
from django.utils.deconstruct import deconstructible
from django.utils.text import slugify
from PIL import Image

from . import images

MB = 1024 * 1024
IMAGE_MAX_BYTES = 10 * MB
AUDIO_MAX_BYTES = 10 * MB

IMAGE_TYPES = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'}
AUDIO_TYPES = {'audio/mpeg': '.mp3', 'audio/aac': '.aac', 'audio/mp4': '.m4a', 'audio/ogg': '.ogg'}

# ISO base-media brands that are audio containers (or generic ones phones use for .m4a).
_MP4_AUDIO_BRANDS = {b'M4A ', b'M4B ', b'mp41', b'mp42', b'isom', b'iso2'}


def sniff(head):
    """MIME type for the leading bytes of a file, or None if not an allowed type."""
    if head.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if head.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        return 'image/webp'
    if head.startswith(b'ID3'):
        return 'audio/mpeg'
    if head.startswith(b'OggS'):
        return 'audio/ogg'
    if head[4:8] == b'ftyp' and head[8:12] in _MP4_AUDIO_BRANDS:
        return 'audio/mp4'
    if len(head) >= 2 and head[0] == 0xFF:
        # 0xFFF sync with layer bits 00 is ADTS AAC; 0xFFE with a real layer is MPEG audio.
        if head[1] & 0xF6 == 0xF0:
            return 'audio/aac'
        if head[1] & 0xE0 == 0xE0 and head[1] & 0x06:
            return 'audio/mpeg'
    return None


def sniff_file(f):
    """Sniff a Django File / UploadedFile without disturbing its read position."""
    pos = f.tell() if hasattr(f, 'tell') else None
    try:
        f.seek(0)
        return sniff(f.read(16))
    finally:
        if pos is not None:
            f.seek(pos)


_KINDS = {
    'image': (IMAGE_TYPES, IMAGE_MAX_BYTES, 'gambar JPG, PNG, atau WebP'),
    'audio': (AUDIO_TYPES, AUDIO_MAX_BYTES, 'audio MP3, AAC/M4A, atau OGG'),
}


@deconstructible
class UploadValidator:
    """Model-field validator; DRF ModelSerializers and admin forms both run it."""

    def __init__(self, kind):
        self.kind = kind

    def __call__(self, value):
        allowed, max_bytes, label = _KINDS[self.kind]
        if value.size is not None and value.size > max_bytes:
            raise ValidationError(f'Ukuran file maksimal {max_bytes // MB} MB.')
        if sniff_file(value) not in allowed:
            raise ValidationError(f'File harus berupa {label}.')
        if self.kind == 'image':
            check_decodes(value, label)

    def __eq__(self, other):
        return isinstance(other, UploadValidator) and self.kind == other.kind


# A 10 MB file can still decode to billions of pixels; 50 MP covers any phone camera.
Image.MAX_IMAGE_PIXELS = 50_000_000


def check_decodes(f, label):
    """The image must actually decode (and within the pixel cap), so the
    processing in images.py can't fail later at save time."""
    pos = f.tell() if hasattr(f, 'tell') else None
    try:
        f.seek(0)
        with Image.open(f) as img:
            img.load()
    except Image.DecompressionBombError:
        raise ValidationError('Resolusi gambar terlalu besar (maksimal 50 megapiksel).')
    except Exception:
        raise ValidationError(f'File rusak atau bukan {label}.')
    finally:
        if pos is not None:
            f.seek(pos)


validate_image_upload = UploadValidator('image')
validate_audio_upload = UploadValidator('audio')


def safe_name(name, content):
    """'<slugified-stem>-<random><ext-from-content>'. Unknown content gets '.bin',
    so even a file that slipped past validation (e.g. written by code) is never
    served with an executable type."""
    ext = {**IMAGE_TYPES, **AUDIO_TYPES}.get(sniff_file(content), '.bin')
    stem = slugify(Path(name).stem)[:60] or 'file'
    return f'{stem}-{secrets.token_hex(4)}{ext}'


class _SafeNameMixin:
    # FieldFile.save() is the one step every write path shares (forms, DRF,
    # field.save() in code) and the only one that sees the content.
    def save(self, name, content, save=True):
        name = safe_name(name, content)
        mime = sniff_file(content)
        if not (isinstance(self.field, SafeImageField) and mime in IMAGE_TYPES):
            super().save(name, content, save)
            return
        # Upright, metadata-free original (see images.py), then renditions.
        cleaned, img, size = images.clean_original(content, mime)
        super().save(name, cleaned, save)
        variants = images.write_renditions(self.storage, self.name, img) if self.field.responsive else {}
        images.record(self.name, size, variants)


class SafeFieldFile(_SafeNameMixin, FieldFile):
    pass


class SafeImageFieldFile(_SafeNameMixin, ImageFieldFile):
    pass


class SafeFileField(models.FileField):
    attr_class = SafeFieldFile


class SafeImageField(models.ImageField):
    """`responsive=False` skips the WebP renditions (QRIS codes must stay sharp);
    EXIF cleanup applies either way. Not a schema option, so not deconstructed."""
    attr_class = SafeImageFieldFile

    def __init__(self, *args, responsive=True, **kwargs):
        self.responsive = responsive
        super().__init__(*args, **kwargs)
