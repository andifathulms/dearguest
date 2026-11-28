"""The Django admin, hardened for launch (Phase 5):

- lives at ADMIN_URL (env), not /admin/;
- staff need a TOTP code as well as the password (ADMIN_REQUIRE_OTP; on
  unless DEBUG). Enrol with `manage.py enrol_totp <username>`;
- 5 failed logins per client address and username lock that pair out for
  15 minutes (nginx also rate-limits the login URL);
- its index is the backoffice overview, with the other backoffice pages under
  ops/ (apps/invitations/backoffice.py).
Installed in config/urls.py by swapping the default site's class, so every
existing `@admin.register` keeps working."""
from django.conf import settings
from django.contrib.admin import AdminSite
from django.core.cache import cache
from django.http import HttpResponse
from django.urls import path
from django_otp.admin import OTPAdminAuthenticationForm, OTPAdminSite

from apps.invitations.throttling import client_ip

MAX_FAILURES = 5
LOCKOUT_SECONDS = 15 * 60


class VowvellaAdminSite(AdminSite):
    site_header = 'Vowvella · Ops'
    site_title = 'Vowvella Ops'
    index_title = 'Ringkasan'
    index_template = 'admin/vowvella/index.html'

    def get_urls(self):
        from apps.invitations import backoffice
        return [
            path('ops/aktivitas/', self.admin_view(backoffice.activity_view), name='ops_activity'),
            path('ops/hari-h/', self.admin_view(backoffice.watch_view), name='ops_watch'),
            path('ops/sistem/', self.admin_view(backoffice.system_view), name='ops_system'),
            path('ops/tema/', self.admin_view(backoffice.themes_view), name='ops_themes'),
        ] + super().get_urls()

    def index(self, request, extra_context=None):
        from apps.invitations import backoffice
        context = {**backoffice.overview(request), 'ops_revenue': backoffice.can_see_revenue(request.user)}
        return super().index(request, {**context, **(extra_context or {})})

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
