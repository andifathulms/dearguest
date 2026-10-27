"""Content-based validation and naming for user uploads.

Uploads are served back from /media/, so the type is decided from the file's
own bytes (magic numbers) -- never from the client's filename or MIME type --
and the stored extension is derived from that sniffed type. A file can't be
uploaded as `song.mp3` and land on disk as something a browser would run.
"""
import secrets
from pathlib import Path

from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.text import slugify

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

    def __eq__(self, other):
        return isinstance(other, UploadValidator) and self.kind == other.kind


validate_image_upload = UploadValidator('image')
validate_audio_upload = UploadValidator('audio')


@deconstructible
class SafeUploadTo:
    """upload_to callable: '<prefix><slugified-stem>-<random><ext-from-content>'.

    Unknown content gets '.bin' so even a file that slipped past validation
    (e.g. an older row re-saved) is never served with an executable type."""

    def __init__(self, prefix, field):
        self.prefix = prefix
        self.field = field

    def __call__(self, instance, filename):
        kind = sniff_file(getattr(instance, self.field).file)
        ext = {**IMAGE_TYPES, **AUDIO_TYPES}.get(kind, '.bin')
        stem = slugify(Path(filename).stem)[:60] or 'file'
        return f'{self.prefix}{stem}-{secrets.token_hex(4)}{ext}'

    def __eq__(self, other):
        return isinstance(other, SafeUploadTo) and (self.prefix, self.field) == (other.prefix, other.field)
