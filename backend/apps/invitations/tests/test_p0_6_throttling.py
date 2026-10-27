"""p0-6: rate limits use a shared cache and an IP the client can't forge."""
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.test import override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .base import APITestBase

RSVP = {'guest_name': 'Sari', 'attending': True, 'pax': 1}


class SharedCacheTests(APITestBase):
    def test_cache_is_shared_redis_not_per_process_memory(self):
        self.assertTrue(settings.CACHES['default']['BACKEND'].endswith('RedisCache'))


class RSVPLimitTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.make_invitation(slug='live')

    def post(self, **headers):
        return self.client.post('/api/invitations/live/rsvp/', RSVP, format='json', **headers)

    def test_limit_holds_across_requests(self):
        for _ in range(5):
            self.assertEqual(self.post().status_code, 201)
        self.assertEqual(self.post().status_code, 429)

    def test_spoofed_forwarded_for_does_not_reset_the_limit(self):
        for i in range(5):
            self.assertEqual(self.post(HTTP_X_FORWARDED_FOR=f'10.0.0.{i}').status_code, 201)
        self.assertEqual(self.post(HTTP_X_FORWARDED_FOR='10.9.9.9').status_code, 429)

    @override_settings(TRUST_PROXY_HEADERS=True)
    def test_behind_nginx_the_real_ip_header_is_used_and_xff_ignored(self):
        for i in range(5):
            self.assertEqual(self.post(HTTP_X_REAL_IP='203.0.113.7', HTTP_X_FORWARDED_FOR=f'10.0.0.{i}').status_code, 201)
        self.assertEqual(self.post(HTTP_X_REAL_IP='203.0.113.7', HTTP_X_FORWARDED_FOR='1.1.1.1').status_code, 429)
        # A different real client still gets through.
        self.assertEqual(self.post(HTTP_X_REAL_IP='203.0.113.8').status_code, 201)


class DRFThrottleTests(APITestBase):
    def test_login_throttle_is_not_reset_by_spoofed_forwarded_for(self):
        statuses = [
            self.client.post('/api/auth/login/', {'username': 'nobody', 'password': 'x'}, format='json',
                             HTTP_X_FORWARDED_FOR=f'10.1.0.{i}').status_code
            for i in range(21)
        ]
        self.assertNotIn(429, statuses[:20])
        self.assertEqual(statuses[20], 429)

    def test_activation_is_throttled(self):
        owner = self.make_user()
        inv = self.make_invitation(owner=owner, active=False, activation_code='ABC123')
        self.login(owner)
        statuses = [
            self.client.post(f'/api/my/invitations/{inv.slug}/activate/', {'code': 'WRONG'}, format='json').status_code
            for _ in range(11)
        ]
        self.assertEqual(statuses[:10], [400] * 10)
        self.assertEqual(statuses[10], 429)


class PasswordResetValidationTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user('sari', email='sari@example.com', password='Old-pass-for-sari-1')
        self.payload = {
            'uid': urlsafe_base64_encode(force_bytes(self.user.pk)),
            'token': default_token_generator.make_token(self.user),
        }

    def confirm(self, password):
        return self.client.post('/api/auth/password-reset-confirm/', {**self.payload, 'password': password}, format='json')

    def test_weak_password_is_rejected(self):
        for weak in ('12345678', 'password', 'sari12'):
            with self.subTest(weak=weak):
                self.assertEqual(self.confirm(weak).status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Old-pass-for-sari-1'))

    def test_strong_password_is_accepted(self):
        self.assertEqual(self.confirm('Kebun-Melati-2026!').status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Kebun-Melati-2026!'))
