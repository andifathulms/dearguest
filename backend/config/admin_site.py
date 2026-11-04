"""The Django admin, hardened for launch (Phase 5):

- lives at ADMIN_URL (env), not /admin/;
- staff need a TOTP code as well as the password (ADMIN_REQUIRE_OTP; on
  unless DEBUG). Enrol with `manage.py enrol_totp <username>`;
- 5 failed logins per client address and username lock that pair out for
  15 minutes (nginx also rate-limits the login URL).
Installed in config/urls.py by swapping the default site's class, so every
existing `@admin.register` keeps working."""
from django.conf import settings
from django.contrib.admin import AdminSite
from django.core.cache import cache
from django.http import HttpResponse
from django_otp.admin import OTPAdminAuthenticationForm, OTPAdminSite

from apps.invitations.throttling import client_ip

MAX_FAILURES = 5
LOCKOUT_SECONDS = 15 * 60


class DearGuestAdminSite(AdminSite):
    def has_permission(self, request):
        allowed = super().has_permission(request)
        if allowed and settings.ADMIN_REQUIRE_OTP:
            # OTPMiddleware adds is_verified(); a user object swapped in by
            # login() mid-request doesn't have it yet.
            return getattr(request.user, 'is_verified', lambda: False)()
        return allowed

    def login(self, request, extra_context=None):
        otp = settings.ADMIN_REQUIRE_OTP
        self.login_form = OTPAdminAuthenticationForm if otp else None
        self.login_template = OTPAdminSite.login_template if otp else None
        if request.method != 'POST':
            return super().login(request, extra_context)

        name = (request.POST.get('username') or '').strip().lower()[:150]
        key = f'admin_login_fail:{client_ip(request)}:{name}'
        if cache.get(key, 0) >= MAX_FAILURES:
            return HttpResponse('Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.', status=429)
        response = super().login(request, extra_context)
        if response.status_code == 302:   # logged in; a failed attempt re-shows the form
            cache.delete(key)
        else:
            cache.add(key, 0, LOCKOUT_SECONDS)
            cache.incr(key)
        return response
