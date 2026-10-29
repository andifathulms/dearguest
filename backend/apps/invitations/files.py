"""Uploaded files leave storage when they leave the database.

Replacing a photo or deleting a row used to leave the old file (and its WebP
renditions) on disk forever; for personal photos that conflicts with the
retention policy (UU PDP). Signals here remove them, after the transaction
commits so a rolled-back change never loses a file still in use. The purge
job and account deletion use remove_stored() directly."""
import logging

from django.db import transaction
from django.db.models import FileField
from django.db.models.signals import post_delete, pre_save

log = logging.getLogger('dearguest.files')


def file_fields(model):
    return [f for f in model._meta.get_fields() if isinstance(f, FileField)]


def remove_stored(storage, name):
    """Delete a stored file, its renditions and its rendition index row."""
    from .models import ProcessedImage
    if not name:
        return 0
    removed = 0
    processed = ProcessedImage.objects.filter(name=name).first()
    names = [name] + (list(processed.variants.values()) if processed else [])
    for n in names:
        try:
            if storage.exists(n):
                storage.delete(n)
                removed += 1
        except OSError:
            log.warning('file delete failed', extra={'file': {'name': n}})
    if processed:
        processed.delete()
    return removed


def _later(storage, name):
    transaction.on_commit(lambda: remove_stored(storage, name))


def _old_files_on_replace(sender, instance, raw=False, **kwargs):
    if raw or not instance.pk:
        return
    fields = file_fields(sender)
    if not fields:
        return
    old = sender.objects.filter(pk=instance.pk).values(*[f.name for f in fields]).first()
    if not old:
        return
    for f in fields:
        before, now = old[f.name], getattr(instance, f.name).name
        if before and before != now:
            _later(f.storage, before)


def _files_on_delete(sender, instance, **kwargs):
    for f in file_fields(sender):
        name = getattr(instance, f.name).name
        if name:
            _later(f.storage, name)


def connect():
    from django.apps import apps
    for model in apps.get_app_config('invitations').get_models():
        if file_fields(model):
            pre_save.connect(_old_files_on_replace, sender=model, dispatch_uid=f'files-replace-{model._meta.label}')
            post_delete.connect(_files_on_delete, sender=model, dispatch_uid=f'files-delete-{model._meta.label}')
