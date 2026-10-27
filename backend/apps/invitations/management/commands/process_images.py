"""Backfill the image pipeline (images.py) for files uploaded before it existed.

    manage.py process_images           # report only: what would change
    manage.py process_images --apply   # strip EXIF, fix orientation, build renditions
"""
from django.apps import apps
from django.core.management.base import BaseCommand

from apps.invitations import images
from apps.invitations.models import ProcessedImage
from apps.invitations.uploads import SafeImageField


def image_fields():
    for model in apps.get_app_config('invitations').get_models():
        if model._meta.proxy:   # e.g. ActivationRequest: same rows as Invitation
            continue
        for field in model._meta.get_fields():
            if isinstance(field, SafeImageField):
                yield model, field


class Command(BaseCommand):
    help = 'Report (or with --apply, fix) stored images that predate EXIF stripping and renditions.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Process the files in place.')

    def handle(self, *args, apply=False, **options):
        totals = {'images': 0, 'missing_file': 0, 'with_exif': 0, 'unprocessed': 0, 'processed_now': 0, 'failed': 0}
        done = set(ProcessedImage.objects.values_list('name', flat=True))
        seen = set()
        for model, field in image_fields():
            for obj in model.objects.exclude(**{field.name: ''}).exclude(**{f'{field.name}__isnull': True}):
                f = getattr(obj, field.name)
                if f.name in seen:   # one file referenced by two rows
                    continue
                seen.add(f.name)
                totals['images'] += 1
                if not f.storage.exists(f.name):
                    totals['missing_file'] += 1
                    continue
                try:
                    exif = images.has_exif(f.storage, f.name)
                except Exception:
                    totals['failed'] += 1
                    self.stderr.write(f'  unreadable: {f.name}')
                    continue
                totals['with_exif'] += exif
                pending = f.name not in done
                totals['unprocessed'] += pending
                if apply and (pending or exif):
                    saved = images.process_stored(f.storage, f.name, field.responsive)
                    if saved and saved != f.name:
                        model.objects.filter(pk=obj.pk).update(**{field.name: saved})
                    totals['processed_now'] += bool(saved)
        mode = 'applied' if apply else 'report only (use --apply to process)'
        self.stdout.write(f'process_images, {mode}: ' + ', '.join(f'{k} {v}' for k, v in totals.items()))
