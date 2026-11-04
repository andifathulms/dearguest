"""Structured logging: one JSON object per line on stdout (Docker rotates
them), each carrying the request id nginx assigned, so a guest's report
("it failed at 07:12") can be followed through nginx and Django. Every
message and extra field passes the PII scrubber first."""
import contextvars
import json
import logging
import re
import uuid
from datetime import datetime, timezone

request_id = contextvars.ContextVar('request_id', default='-')

_STANDARD = set(vars(logging.makeLogRecord({}))) | {'message', 'asctime'}
_VALID_ID = re.compile(r'^[A-Za-z0-9-]{8,64}$')


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id.get()
        return True


class JSONFormatter(logging.Formatter):
    def format(self, record):
        from apps.invitations.pii import scrub, scrub_text
        entry = {
            'time': datetime.fromtimestamp(record.created, timezone.utc).isoformat(timespec='milliseconds'),
            'level': record.levelname,
            'logger': record.name,
            'message': scrub_text(record.getMessage()),
            'request_id': getattr(record, 'request_id', '-'),
        }
        extra = {k: v for k, v in vars(record).items() if k not in _STANDARD and k != 'request_id'}
        if extra:
            entry.update(scrub(extra))
        if record.exc_info:
            entry['exception'] = scrub_text(self.formatException(record.exc_info))
        return json.dumps(entry, ensure_ascii=False, default=str)


class RequestIdMiddleware:
    """Use nginx's X-Request-ID (or make one), expose it to logs and echo it."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming = request.META.get('HTTP_X_REQUEST_ID', '')
        rid = incoming if _VALID_ID.match(incoming) else uuid.uuid4().hex
        token = request_id.set(rid)
        try:
            response = self.get_response(request)
        finally:
            request_id.reset(token)
        response['X-Request-ID'] = rid
        return response


def config(debug):
    return {
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {'request_id': {'()': RequestIdFilter}},
        'formatters': {
            'json': {'()': JSONFormatter},
            'plain': {'format': '%(levelname)s %(name)s [%(request_id)s] %(message)s'},
        },
        'handlers': {
            'stdout': {'class': 'logging.StreamHandler', 'filters': ['request_id'],
                       'formatter': 'plain' if debug else 'json'},
        },
        'root': {'handlers': ['stdout'], 'level': 'INFO'},
        'loggers': {
            # Django logs every 4xx as a warning with the full path; the path can
            # carry a guest code, and nginx already logs requests.
            'django.request': {'level': 'ERROR'},
            'django.server': {'level': 'WARNING'},
        },
    }
