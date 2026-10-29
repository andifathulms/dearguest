from django.middleware.csrf import CsrfViewMiddleware
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .cookies import ACCESS_COOKIE


class _CSRFCheck(CsrfViewMiddleware):
    def _reject(self, request, reason):
        return reason


class CookieJWTAuthentication(JWTAuthentication):
    """The access JWT from the dg_access cookie (see cookies.py).

    A missing, expired or invalid cookie means "not logged in" rather than an
    error, so public pages still load; protected views answer 401 and the
    client refreshes. Because browsers send cookies on their own, unsafe
    methods must also carry the CSRF token, as with Django's session auth."""

    def authenticate(self, request):
        raw = request.COOKIES.get(ACCESS_COOKIE)
        if not raw:
            return None
        try:
            token = self.get_validated_token(raw)
            user = self.get_user(token)
        except (InvalidToken, TokenError):
            return None
        self.enforce_csrf(request)
        return user, token

    def enforce_csrf(self, request):
        check = _CSRFCheck(lambda req: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise PermissionDenied(f'CSRF gagal: {reason}')
