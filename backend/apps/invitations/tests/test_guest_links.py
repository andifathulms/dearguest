"""Guest links: short unambiguous codes unique per invitation, /<slug>/<code>
lookups (case-insensitive, legacy hex codes), and rate limits that stop
anyone enumerating codes to harvest guests' names."""
from unittest import mock

from django.core.cache import cache

from apps.invitations import views
from apps.invitations.models import GUEST_CODE_ALPHABET, RSVP, Guest, find_guest

from .base import APITestBase


class GuestCodeTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.inv = self.make_invitation(active=True)

    def test_new_codes_are_short_and_unambiguous(self):
        codes = {Guest.objects.create(invitation=self.inv, name=f'Tamu {i}').code for i in range(200)}
        self.assertEqual(len(codes), 200)
        for code in codes:
            self.assertEqual(len(code), 6)
            self.assertTrue(set(code) <= set(GUEST_CODE_ALPHABET), code)
            self.assertFalse(set(code) & set('0O1lI'))

    def test_codes_are_unique_per_invitation_not_globally(self):
        other = self.make_invitation(slug='lain', active=True)
        Guest.objects.create(invitation=self.inv, name='A', code='ABCDEF')
        Guest.objects.create(invitation=other, name='B', code='ABCDEF')   # fine elsewhere
        with self.assertRaises(Exception):
            Guest.objects.create(invitation=self.inv, name='C', code='ABCDEF')

    def test_find_guest_is_case_insensitive_and_keeps_legacy_hex_codes(self):
        new = Guest.objects.create(invitation=self.inv, name='Baru', code='K7MPQ2')
        old = Guest.objects.create(invitation=self.inv, name='Lama', code='3fa9c01b')
        self.assertEqual(find_guest(self.inv, 'k7mpq2'), new)
        self.assertEqual(find_guest(self.inv, 'K7MPQ2'), new)
        self.assertEqual(find_guest(self.inv, '3fa9c01b'), old)
        self.assertIsNone(find_guest(self.inv, ''))
        self.assertIsNone(find_guest(self.inv, 'x' * 40))


class GuestLookupApiTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.inv = self.make_invitation(active=True)
        self.guest = Guest.objects.create(invitation=self.inv, name='Bapak Ahmad', max_pax=3,
                                          whatsapp='08123456789', group='Kantor', code='K7MPQ2')

    def url(self, code):
        return f'/api/invitations/{self.inv.slug}/guest/{code}/'

    def test_lookup_returns_only_code_name_and_limit(self):
        res = self.client.get(self.url('k7mpq2'))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {'code': 'K7MPQ2', 'name': 'Bapak Ahmad', 'max_pax': 3})

    def test_unknown_code_is_a_plain_404(self):
        res = self.client.get(self.url('ZZZZZZ'))
        self.assertEqual(res.status_code, 404)
        self.assertNotIn('Ahmad', str(res.data))

    def test_per_ip_rate_limit(self):
        from rest_framework.settings import api_settings
        rates = {**api_settings.DEFAULT_THROTTLE_RATES, 'guest_lookup': '3/hour'}
        with mock.patch.object(views.PublicGuestView, 'throttle_scope', 'guest_lookup'), \
                mock.patch('rest_framework.throttling.ScopedRateThrottle.THROTTLE_RATES', rates):
            codes = [self.client.get(self.url(f'AAAAA{i}')).status_code for i in range(5)]
        self.assertEqual(codes[:3], [404, 404, 404])
        self.assertEqual(codes[3:], [429, 429])

    def test_per_invitation_rate_limit(self):
        cache.set(f'guest_lookup_{self.inv.slug}', views.GUEST_LOOKUPS_PER_SLUG_PER_HOUR, 3600)
        self.assertEqual(self.client.get(self.url('K7MPQ2')).status_code, 429)

    def test_draft_invitations_reveal_nothing(self):
        self.inv.is_active = False
        self.inv.save()
        self.assertEqual(self.client.get(self.url('K7MPQ2')).status_code, 404)

    def test_rsvp_with_a_retyped_lower_case_code_links_the_guest(self):
        res = self.client.post(f'/api/invitations/{self.inv.slug}/rsvp/',
                               {'guest_name': 'x', 'attending': True, 'pax': 2, 'guest_code': 'k7mpq2'}, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(RSVP.objects.get().guest, self.guest)
