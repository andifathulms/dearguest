"""GET /api/health/ for uptime monitors and the deploy script's smoke check.

Basic: database, cache (Redis) and media storage (write, read, delete).
?deep=1 with the HEALTH_TOKEN (header X-Health-Token or ?token=) also checks:
disk usage under DISK_ALERT_PERCENT, the TLS certificate's days left (from
the scheduler's daily check) and that every scheduled job ran recently.
The body always says "status": "ok" or "fail" (UptimeRobot keyword monitor),
and failures answer 503."""
import secrets
import shutil
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import connection
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.cache import never_cache

from . import ops

DISK_ALERT_PERCENT = 80
CERT_ALERT_DAYS = 14
# Job -> how long it may stay silent (daily jobs get a 2 h margin).
JOBS = {'backup': timedelta(hours=26), 'purge': timedelta(hours=26), 'cert_check': timedelta(hours=26)}


def _check(fn, explain=False):
    """Run one check. Public checks report only the error type (a database
    error message can name hosts); token-protected ones explain themselves."""
    try:
        detail = fn()
        return {'ok': True, **(detail or {})}
    except Exception as exc:   # report, never raise: this is the alarm itself
        return {'ok': False, 'error': str(exc) if explain else type(exc).__name__}


def _db():
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')


def _cache():
    key = f'health:{uuid.uuid4().hex}'
    cache.set(key, 1, 10)
    if cache.get(key) != 1:
        raise RuntimeError('cache read-back failed')
    cache.delete(key)


def _storage():
    name = default_storage.save(f'health/{uuid.uuid4().hex}.txt', ContentFile(b'ok'))
    try:
        with default_storage.open(name) as f:
            if f.read() != b'ok':
                raise RuntimeError('storage read-back failed')
    finally:
        default_storage.delete(name)


def _disk():
    usage = shutil.disk_usage(settings.MEDIA_ROOT)
    percent = round(usage.used / usage.total * 100, 1)
    if percent >= DISK_ALERT_PERCENT:
        raise RuntimeError(f'disk {percent}%')
    return {'percent': percent}


def _cert():
    days = cache.get('ops:cert_days')
    if days is None:
        raise RuntimeError('not checked yet')
    if days < CERT_ALERT_DAYS:
        raise RuntimeError(f'{days} days left')
    return {'days_left': days}


def _jobs():
    now = timezone.now()
    stale = {}
    for job, limit in JOBS.items():
        last = ops.last_run(job)
        if not last or now - last > limit:
            stale[job] = last.isoformat() if last else 'never'
    if stale:
        raise RuntimeError(', '.join(f'{j}: {when}' for j, when in stale.items()))
    return {}


@never_cache
def health_view(request):
    checks = {'database': _check(_db), 'cache': _check(_cache), 'storage': _check(_storage)}
    if request.GET.get('deep'):
        token = request.headers.get('X-Health-Token') or request.GET.get('token') or ''
        if not settings.HEALTH_TOKEN or not secrets.compare_digest(token, settings.HEALTH_TOKEN):
            return JsonResponse({'status': 'fail', 'error': 'token'}, status=403)
        checks.update({'disk': _check(_disk, True), 'certificate': _check(_cert, True), 'jobs': _check(_jobs, True)})
    ok = all(c['ok'] for c in checks.values())
    return JsonResponse({'status': 'ok' if ok else 'fail', 'release': settings.RELEASE, 'checks': checks},
                        status=200 if ok else 503)
