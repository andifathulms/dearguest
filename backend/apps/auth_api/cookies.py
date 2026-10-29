"""Session tokens in httpOnly cookies instead of the browser's localStorage, so
a script injected into the page can't read them.

- dg_access: the short-lived access JWT, sent with every same-site request.
- dg_refresh: the refresh JWT, sent only to /api/auth/ (refresh, logout).
Both are httpOnly, SameSite=Lax and Secure outside development. Unsafe
methods also need Django's CSRF token (CookieJWTAuthentication)."""
from django.conf import settings
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
    return response
