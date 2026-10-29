"""Caching what every guest downloads, for the hour before the akad when
hundreds open the same invitation (Phase 5 load test).

- The public invitation payload (InvitationDetailView) is cached per
  invitation, host and variant for PAYLOAD_TTL, under a version number.
  Saving or deleting the invitation or anything shown on it (couple,
  events, story, photos, bank accounts) bumps that invitation's version, so
  an edit shows on the very next request; music presets and image
  renditions bump a global version.
- The wishes wall (polled every 30 s by every open invitation) is cached per
  page for WISHES_TTL under the invitation's RSVP version, bumped by any
  RSVP change (a new wish, moderation).
The is-it-public check runs before the cache on every request, so expiry and
deactivation take effect immediately."""
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save

PAYLOAD_TTL = 10 * 60
WISHES_TTL = 30


def _version(key):
    return cache.get(key) or 0


def _bump(key):
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=None)


def payload_key(invitation_id, host, variant):
    return (f'inv:payload:{invitation_id}:{_version(f"inv:ver:{invitation_id}")}:{_version("inv:ver:all")}'
            f':{host}:{variant or "-"}')


def wishes_key(invitation_id, page):
    return f'inv:wishes:{invitation_id}:{_version(f"inv:rsvp:{invitation_id}")}:{page or 1}'


def _on_invitation_change(sender, instance, **kwargs):
    _bump(f'inv:ver:{instance.pk}')


def _on_child_change(sender, instance, **kwargs):
    if instance.invitation_id:
        _bump(f'inv:ver:{instance.invitation_id}')


def _on_shared_change(sender, instance, **kwargs):
    _bump('inv:ver:all')


def _on_rsvp_change(sender, instance, **kwargs):
    _bump(f'inv:rsvp:{instance.invitation_id}')


def connect():
    from .models import (ActivationRequest, BankAccount, Couple, Event, Invitation, MusicPreset, Photo,
                         ProcessedImage, RSVP, Story)
    for signal in (post_save, post_delete):
        for model in (Invitation, ActivationRequest):
            signal.connect(_on_invitation_change, sender=model, dispatch_uid=f'payload-{model.__name__}-{signal}')
        for model in (Couple, Event, Story, Photo, BankAccount):
            signal.connect(_on_child_change, sender=model, dispatch_uid=f'payload-{model.__name__}-{signal}')
        for model in (MusicPreset, ProcessedImage):
            signal.connect(_on_shared_change, sender=model, dispatch_uid=f'payload-{model.__name__}-{signal}')
        signal.connect(_on_rsvp_change, sender=RSVP, dispatch_uid=f'payload-rsvp-{signal}')
