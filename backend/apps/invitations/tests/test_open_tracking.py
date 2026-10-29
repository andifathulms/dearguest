"""Open tracking: one beacon per personal-link open, without IPs; crawlers,
the couple and quick repeats don't count."""
from unittest import mock

from django.contrib.auth.models import User

from apps.invitations.models import Guest

from .base import APITestBase

BROWSER = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120 Mobile'


class OpenTrackingTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, slug='live')
        self.guest = Guest.objects.create(invitation=self.inv, name='Budi', code='K7MPQ2', sent_at='2026-10-28T10:00Z')
        self.url = '/api/invitations/live/guest/k7mpq2/open/'

    def open(self, ua=BROWSER):
        return self.client.post(self.url, HTTP_USER_AGENT=ua)

    def test_first_open_is_recorded_and_repeats_within_30_minutes_count_once(self):
        self.assertEqual(self.open().status_code, 204)
        self.assertEqual(self.open().status_code, 204)
        self.guest.refresh_from_db()
        self.assertEqual(self.guest.open_count, 1)
        self.assertIsNotNone(self.guest.first_opened_at)
        first = self.guest.first_opened_at

        with mock.patch('apps.invitations.views.cache.add', return_value=True):   # window passed
            self.open()
        self.guest.refresh_from_db()
        self.assertEqual(self.guest.open_count, 2)
        self.assertEqual(self.guest.first_opened_at, first)
        self.assertGreaterEqual(self.guest.last_opened_at, first)

    def test_crawlers_and_the_couple_are_ignored(self):
        for ua in ('WhatsApp/2.23.20.0 A', 'facebookexternalhit/1.1', 'TelegramBot (like TwitterBot)'):
            self.assertEqual(self.open(ua).status_code, 204)
        self.login(self.owner)
        self.open()
        self.login(User.objects.create_user('staff', password='x-Strong-pass-91', is_staff=True))
        self.open()
        self.guest.refresh_from_db()
        self.assertEqual(self.guest.open_count, 0)

    def test_unknown_codes_and_hidden_invitations_get_404(self):
        self.assertEqual(self.client.post('/api/invitations/live/guest/ZZZZZZ/open/').status_code, 404)
        self.inv.is_active = False
        self.inv.save()
        self.assertEqual(self.open().status_code, 404)

    def test_dashboard_sees_sent_but_not_opened(self):
        Guest.objects.create(invitation=self.inv, name='Siti')
        self.login(self.owner)
        res = self.client.get('/api/invitations/live/guests/')
        self.assertEqual(res.data['stats']['sent_not_opened'], 1)
        self.client.logout()
        self.client.force_authenticate(None)
        self.open()
        self.login(self.owner)
        res = self.client.get('/api/invitations/live/guests/')
        self.assertEqual((res.data['stats']['opened'], res.data['stats']['sent_not_opened']), (1, 0))
        budi = next(g for g in res.data['guests'] if g['name'] == 'Budi')
        self.assertEqual(budi['open_count'], 1)

    def test_nothing_identifying_is_stored(self):
        fields = {f.name for f in Guest._meta.get_fields()}
        self.assertFalse(fields & {'ip', 'ip_address', 'user_agent', 'last_ip', 'device'})
