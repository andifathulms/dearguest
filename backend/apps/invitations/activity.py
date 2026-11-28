"""The backoffice activity feed: one ActivityEvent row per thing that happened.
Callers pass ids and small facts only (counts, theme ids, flags), never guest
names, numbers or wish text; see ActivityEvent."""
from datetime import timedelta

from django.utils import timezone

from .models import ActivityEvent

KEEP_DAYS = 180


def record(kind, invitation=None, user=None, actor='couple', **meta):
    if user is not None and not getattr(user, 'is_authenticated', False):
        user = None
    return ActivityEvent.objects.create(kind=kind, actor=actor, invitation=invitation, user=user, meta=meta)


def prune(now=None):
    """Delete rows older than KEEP_DAYS; returns how many."""
    cutoff = (now or timezone.now()) - timedelta(days=KEEP_DAYS)
    deleted, _ = ActivityEvent.objects.filter(created_at__lt=cutoff).delete()
    return deleted
