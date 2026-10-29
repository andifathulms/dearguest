"""Session tokens in httpOnly cookies instead of the browser's localStorage, so
a script injected into the page can't read them.

- dg_access: the short-lived access JWT, sent with every same-site request.
- dg_refresh: the refresh JWT, sent only to /api/auth/ (refresh, logout).
Both are httpOnly, SameSite=Lax and Secure outside development. Unsafe
methods also need Django's CSRF token (CookieJWTAuthentication)."""
from django.conf import settings
from django.core import signing
from django.middleware.csrf import get_token
from rest_framework_simplejwt.settings import api_settings as jwt_settings

ACCESS_COOKIE = 'dg_access'
REFRESH_COOKIE = 'dg_refresh'
REFRESH_PATH = '/api/auth/'


def _flags():
    return {'httponly': True, 'secure': settings.AUTH_COOKIE_SECURE, 'samesite': 'Lax'}


def set_session(request, response, access, refresh=None):
    """Put the tokens on the response, plus the readable CSRF cookie the client
    echoes back in X-CSRFToken."""
    response.set_cookie(ACCESS_COOKIE, str(access), path='/',
                        max_age=int(jwt_settings.ACCESS_TOKEN_LIFETIME.total_seconds()), **_flags())
    if refresh is not None:
        response.set_cookie(REFRESH_COOKIE, str(refresh), path=REFRESH_PATH,
                            max_age=int(jwt_settings.REFRESH_TOKEN_LIFETIME.total_seconds()), **_flags())
    get_token(request)   # CsrfViewMiddleware then sets the csrftoken cookie
    return response


def clear_session(response):
    response.delete_cookie(ACCESS_COOKIE, path='/', samesite='Lax')
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_PATH, samesite='Lax')
    response.delete_cookie(RECENT_COOKIE, path='/api/', samesite='Lax')
    return response


# Re-authentication: export and account deletion need the password again
# within the last few minutes, proven by a short-lived signed cookie.
RECENT_COOKIE = 'dg_recent'
RECENT_SECONDS = 5 * 60
_RECENT_SALT = 'dearguest.recent-auth'


def mark_recent(response, user):
    value = signing.dumps({'u': user.pk}, salt=_RECENT_SALT)
    response.set_cookie(RECENT_COOKIE, value, path='/api/', max_age=RECENT_SECONDS, **_flags())
    return response


def recently_authenticated(request):
    raw = request.COOKIES.get(RECENT_COOKIE)
    if not raw or not request.user.is_authenticated:
        return False
    try:
        data = signing.loads(raw, salt=_RECENT_SALT, max_age=RECENT_SECONDS)
    except signing.BadSignature:
        return False
    return data.get('u') == request.user.pk
