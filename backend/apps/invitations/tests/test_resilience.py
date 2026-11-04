"""Third parties being down must not take guests down: with the error tracker
unreachable and email failing, invitations still load and RSVPs still save.
(The payment provider joins this list in Phase 3.)"""
import time

import sentry_sdk
from django.test import override_settings

from apps.invitations.models import RSVP
from config import sentry as sentry_config

from .base import APITestBase


class BrokenEmailBackend:
    """Like Django's SMTP backend with the server unreachable: raises, unless
    the caller asked for fail_silently."""

    def __init__(self, fail_silently=False, **kwargs):
        self.fail_silently = fail_silently

    def send_messages(self, messages):
        if self.fail_silently:
            return 0
        raise ConnectionError('SMTP unreachable')


class ResilienceTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, slug='andini-bagus')

    def tearDown(self):
        sentry_sdk.init(dsn=None)
        super().tearDown()

    def test_sentry_unreachable(self):
        # A DSN pointing at a closed port: events queue in the background.
        sentry_config.init('http://public@127.0.0.1:9/1', 'test', 'test')
        started = time.monotonic()
        self.assertEqual(self.client.get('/api/invitations/andini-bagus/').status_code, 200)
        res = self.client.post('/api/invitations/andini-bagus/rsvp/', {'guest_name': 'Budi', 'attending': True, 'pax': 1},
                               format='json')
        self.assertIn(res.status_code, (200, 201))
        sentry_sdk.capture_message('probe')   # must not block
        self.assertLess(time.monotonic() - started, 5)
        self.assertEqual(RSVP.objects.count(), 1)

    @override_settings(EMAIL_BACKEND='apps.invitations.tests.test_resilience.BrokenEmailBackend')
    def test_email_down(self):
        self.assertEqual(self.client.get('/api/invitations/andini-bagus/').status_code, 200)
        res = self.client.post('/api/invitations/andini-bagus/rsvp/', {'guest_name': 'Budi', 'attending': True, 'pax': 1},
                               format='json')
        self.assertIn(res.status_code, (200, 201))
        # Flows that do send email degrade instead of failing.
        res = self.client.post('/api/auth/password-reset/', {'username_or_email': self.owner.username}, format='json')
        self.assertEqual(res.status_code, 200)
        self.make_invitation(owner=self.owner, slug='draf', active=False)
        self.login(self.owner)
        self.assertEqual(self.client.post('/api/my/invitations/draf/request-activation/').status_code, 200)
