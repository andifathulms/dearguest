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
_SAFE_KEYS = {'event_id', 'trace_id', 'span_id', 'parent_span_id', 'start_timestamp', 'level', 'logger', 'platform', 'release', 'environment', 'timestamp', 'type',
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
    if key in _SAFE_KEYS:
        return value   # ids, timestamps, levels: not personal, and must stay intact
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
    if 'exception' in event:
        event['exception'] = _scrub_frames(event['exception'])
    if 'logentry' in event:
        event['logentry'] = _scrub_logentry(event['logentry'])
    if event.get('message'):
        event['message'] = MASK
    crumbs = event.get('breadcrumbs')
    if isinstance(crumbs, dict) and isinstance(crumbs.get('values'), list):
        crumbs['values'] = [scrub_breadcrumb(c) for c in crumbs['values']]
    for key in ('extra', 'contexts', 'tags', 'spans'):
        if key in event:
            event[key] = scrub(event[key])
    if isinstance(event.get('transaction'), str):
        event['transaction'] = scrub_text(event['transaction'])
    return event


def _scrub_frames(exception):
    """Keep what debugging needs (exception type, code locations); drop the
    message, which can quote anything a guest typed -- names and addresses
    that no pattern can recognise -- and every frame's local variables."""
    for exc in (exception or {}).get('values', []):
        if exc.get('value'):
            exc['value'] = MASK
        for frame in (exc.get('stacktrace') or {}).get('frames', []):
            frame.pop('vars', None)
    return exception


def _scrub_logentry(entry):
    """Log events: keep the message template ("kirim ke %s gagal"), never
    the parameters or the formatted text."""
    if isinstance(entry, dict):
        entry.pop('formatted', None)
        if entry.get('params'):
            entry['params'] = [MASK for _ in entry['params']]
        entry['message'] = scrub_text(entry.get('message'))
    return entry


def scrub_breadcrumb(crumb, hint=None):
    """SQL breadcrumbs carry %s placeholders only; any other message may quote
    personal data, so it is dropped."""
    crumb = scrub(crumb)
    if crumb.get('category') != 'query' and crumb.get('message'):
        crumb['message'] = MASK
    return crumb
