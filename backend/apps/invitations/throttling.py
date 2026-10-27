"""Client identity for rate limiting.

X-Forwarded-For is client-controlled: nginx *appends* to whatever the client
sent, so its first entry is whatever the client wants it to be. We never read
it. Behind our nginx (TRUST_PROXY_HEADERS=True, production) the client is the
X-Real-IP that nginx sets from its own $remote_addr; anywhere else it's the
socket's REMOTE_ADDR.
"""
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle


def client_ip(request):
    request = getattr(request, '_request', request)  # accept DRF or Django requests
    if getattr(settings, 'TRUST_PROXY_HEADERS', False):
        real_ip = request.META.get('HTTP_X_REAL_IP', '').strip()
        if real_ip:
            return real_ip
    return request.META.get('REMOTE_ADDR', '')


class ClientIPScopedRateThrottle(ScopedRateThrottle):
    """DRF's scoped throttle, keyed on client_ip() instead of DRF's XFF parsing."""

    def get_ident(self, request):
        return client_ip(request)
