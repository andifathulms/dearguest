"""Heartbeats for scheduled jobs: each job records when it last succeeded, and
the deep health check (/api/health/?deep=1) alerts when one goes quiet."""
from django.core.cache import cache
from django.utils import timezone

PREFIX = 'ops:last:'


def heartbeat(job):
    cache.set(PREFIX + job, timezone.now().isoformat(), timeout=None)


def last_run(job):
    value = cache.get(PREFIX + job)
    return timezone.datetime.fromisoformat(value) if value else None
