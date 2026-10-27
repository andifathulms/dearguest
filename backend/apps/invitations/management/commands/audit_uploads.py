"""List stored uploads whose real content isn't an allowed type. Report only:
nothing is modified or deleted."""
from django.core.management.base import BaseCommand

from apps.invitations.models import Invitation, Couple, Photo, BankAccount, MusicPreset
from apps.invitations.uploads import IMAGE_TYPES, AUDIO_TYPES, sniff

FIELDS = [
    (Invitation, 'hero_photo', IMAGE_TYPES),
    (Invitation, 'music_file', AUDIO_TYPES),
    (Couple, 'bride_photo', IMAGE_TYPES),
    (Couple, 'groom_photo', IMAGE_TYPES),
    (Photo, 'image', IMAGE_TYPES),
    (BankAccount, 'qris_image', IMAGE_TYPES),
    (MusicPreset, 'audio', AUDIO_TYPES),
]


class Command(BaseCommand):
    help = 'Report stored uploads whose content type is not allowed (read-only).'

    def handle(self, *args, **options):
        checked, bad, missing = 0, [], []
        for model, field, allowed in FIELDS:
            for obj in model.objects.exclude(**{field: ''}).exclude(**{f'{field}__isnull': True}):
                f = getattr(obj, field)
                label = f'{model.__name__}#{obj.pk}.{field}: {f.name}'
                checked += 1
                try:
                    with f.storage.open(f.name, 'rb') as fh:
                        kind = sniff(fh.read(16))
                except FileNotFoundError:
                    missing.append(label)
                    continue
                if kind not in allowed:
                    bad.append(f'{label} (detected: {kind or "unknown"})')

        self.stdout.write(f'Checked {checked} stored files.')
        self.stdout.write(f'Disallowed content: {len(bad)}')
        for line in bad:
            self.stdout.write(f'  ✗ {line}')
        self.stdout.write(f'Missing from storage: {len(missing)}')
        for line in missing:
            self.stdout.write(f'  ? {line}')
        self.stdout.write('Report only — nothing was changed.')
