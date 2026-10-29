"""Scrubbing personal data out of everything that leaves the server: error
reports (Sentry), structured logs and CSP reports.

Guests' names, WhatsApp numbers, emails and addresses, guest-link codes,
`?to=` names, session tokens and request bodies must never reach a third
party. Two layers:
- keys: values under sensitive keys (name, whatsapp, email, token, cookie,
  password, body...) are replaced wholesale, whatever they look like;
- patterns: free text (exception messages, URLs, SQL) is masked for phone
  numbers, emails, JWTs, `?to=` values and guest codes in /<slug>/<code>.
"""
import re

MASK = '[disaring]'

SENSITIVE_KEYS = re.compile(
    r'(name|nama|whatsapp|wa_?number|phone|telepon|hp|email|address|alamat|wishes|ucapan|'
    r'guest|tamu|code|kode|token|secret|password|passwd|cookie|authorization|session|csrf|'
    r'account_number|rekening|body|data|query_string|to)$',
    re.IGNORECASE,
)
_SAFE_KEYS = {'event_id', 'level', 'logger', 'platform', 'release', 'environment', 'timestamp', 'type',
              'module', 'function', 'filename', 'lineno', 'abs_path', 'request_id', 'method', 'status'}

_PATTERNS = [
    (re.compile(r'eyJ[\w-]+\.[\w-]+\.[\w-]+'), '[jwt]'),                          # JWTs
    (re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+'), '[email]'),                        # emails
    (re.compile(r'(?<!\d)(\+?62|0)8\d[\d\s.-]{6,13}\d'), '[nomor]'),               # Indonesian mobiles
    (re.compile(r'(?<![\w/])(\+?\d[\d\s.-]{8,16}\d)'), '[nomor]'),                 # other long numbers
    (re.compile(r'([?&](?:to|g|nama|name)=)[^&#\s"\']*', re.IGNORECASE), r'\1' + MASK),  # ?to=Budi
    # /<slug>/<CODE>: the second path segment of an invitation link is a guest code.
    (re.compile(r'(/[a-z0-9][a-z0-9-]{1,99}/)([A-Za-z0-9]{6,12})(?=[/?#"\'\s]|$)'), r'\1[kode]'),
]
# Paths whose second segment is not a guest code.
_NOT_CODES = re.compile(r'/(api|dashboard|tema|og|share|static|assets|media|kelola|admin|theme-previews|social)/')


def scrub_text(text):
    if not isinstance(text, str) or not text:
        return text
    for pattern, replacement in _PATTERNS[:-1]:
        text = pattern.sub(replacement, text)
    code_re, code_sub = _PATTERNS[-1]
    return code_re.sub(lambda m: m.group(0) if _NOT_CODES.search(m.group(1) + '/') else m.expand(code_sub), text)


def scrub(value, key=None, depth=0):
    """Recursively scrub dicts/lists/strings. Values under sensitive keys are
    masked outright; everything else is pattern-scrubbed."""
    if depth > 12:
        return MASK
    if key is not None and key not in _SAFE_KEYS and SENSITIVE_KEYS.search(str(key)):
        return MASK if value not in (None, '', [], {}) else value
    if isinstance(value, dict):
        return {k: scrub(v, k, depth + 1) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [scrub(v, None, depth + 1) for v in value]
    if isinstance(value, str):
        return scrub_text(value)
    return value


def scrub_event(event, hint=None):
    """Sentry before_send / before_send_transaction."""
    request = event.get('request')
    if isinstance(request, dict):
        for key in ('data', 'cookies', 'query_string', 'env'):
            if request.get(key):
                request[key] = MASK
        headers = request.get('headers') or {}
        request['headers'] = {k: (MASK if k.lower() in ('cookie', 'authorization', 'x-csrftoken', 'referer')
                                  else scrub_text(v)) for k, v in headers.items()}
        if request.get('url'):
            request['url'] = scrub_text(request['url'])
    event.pop('user', None)
    for key in ('exception', 'logentry', 'message', 'breadcrumbs', 'extra', 'contexts', 'tags', 'transaction', 'spans'):
        if key in event:
            event[key] = _scrub_frames(event[key]) if key == 'exception' else scrub(event[key])
    return event


def _scrub_frames(exception):
    """Exception values and stack locals: keep code locations, scrub the rest."""
    for exc in (exception or {}).get('values', []):
        exc['value'] = scrub_text(exc.get('value'))
        for frame in (exc.get('stacktrace') or {}).get('frames', []):
            if 'vars' in frame:
                frame['vars'] = {k: MASK for k in frame['vars']}
    return exception


def scrub_breadcrumb(crumb, hint=None):
    return scrub(crumb)
