"""Maps input: share links and coordinates are accepted, embed code and other
URLs are refused, and the iframe URL is always built by the server."""
from decimal import Decimal

from django.test import SimpleTestCase

from apps.invitations import maps
from apps.invitations.models import Event

from .base import APITestBase


class NormaliseMapsInputTests(SimpleTestCase):
    def test_accepted_inputs(self):
        cases = {
            '': ('', None, None),
            '-7.8038, 110.3624': ('', Decimal('-7.803800'), Decimal('110.362400')),
            'https://maps.app.goo.gl/AbCdEf123': ('https://maps.app.goo.gl/AbCdEf123', None, None),
            'maps.app.goo.gl/AbCdEf123': ('https://maps.app.goo.gl/AbCdEf123', None, None),
            'https://goo.gl/maps/xyz': ('https://goo.gl/maps/xyz', None, None),
            'http://maps.google.com/?q=-7.78,110.40': ('https://maps.google.com/?q=-7.78,110.40', Decimal('-7.780000'), Decimal('110.400000')),
            'https://www.google.com/maps/search/?api=1&query=-7.78%2C110.40':
                ('https://www.google.com/maps/search/?api=1&query=-7.78%2C110.40', Decimal('-7.780000'), Decimal('110.400000')),
            'https://www.google.co.id/maps/@-7.80,110.36,17z': ('https://www.google.co.id/maps/@-7.80,110.36,17z', Decimal('-7.800000'), Decimal('110.360000')),
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(maps.normalise_maps_input(raw), expected)

    def test_place_pin_wins_over_viewport(self):
        url = 'https://www.google.com/maps/place/Masjid/@-7.79,110.35,17z/data=!3m1!4b1!4m6!3m5!8m2!3d-7.8038203!4d110.3623919'
        _, lat, lng = maps.normalise_maps_input(url)
        self.assertEqual((lat, lng), (Decimal('-7.803820'), Decimal('110.362392')))

    def test_refused_inputs(self):
        embed = '<iframe src="https://www.google.com/maps/embed?pb=!1m18" width="600"></iframe>'
        with self.assertRaisesMessage(maps.MapsInputError, 'bukan kode embed'):
            maps.normalise_maps_input(embed)
        for raw in ('https://evil.example/maps', 'javascript:alert(1)', 'https://www.google.com/search?q=masjid',
                    'https://maps.google.com.evil.example/x', '95, 110', 'Masjid Gedhe Kauman'):
            with self.subTest(raw=raw), self.assertRaises(maps.MapsInputError):
                maps.normalise_maps_input(raw)


class EventMapsApiTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, active=True)
        self.login(self.owner)
        self.url = f'/api/my/invitations/{self.inv.slug}/events/'

    def add(self, maps_link):
        return self.client.post(self.url, {'event_type': 'resepsi', 'start': '2026-12-12T11:00:00+07:00',
                                           'timezone': 'Asia/Jakarta', 'venue_name': 'Gedung Graha',
                                           'address': 'Jl. Sudirman 45', 'maps_link': maps_link}, format='json')

    def test_coordinates_drive_open_and_embed_urls(self):
        res = self.add('-7.782146, 110.402654')
        self.assertEqual(res.status_code, 201, res.data)
        ev = self.client.get(f'/api/invitations/{self.inv.slug}/').data['events'][0]
        self.assertEqual(ev['maps_url'], 'https://www.google.com/maps/search/?api=1&query=-7.782146,110.402654')
        self.assertEqual(ev['embed_url'], 'https://www.google.com/maps?q=-7.782146%2C110.402654&z=16&output=embed')

    def test_share_link_opens_as_is_and_embed_uses_the_venue(self):
        self.add('https://maps.app.goo.gl/AbCdEf123')
        ev = self.client.get(f'/api/invitations/{self.inv.slug}/').data['events'][0]
        self.assertEqual(ev['maps_url'], 'https://maps.app.goo.gl/AbCdEf123')
        self.assertTrue(ev['embed_url'].startswith('https://www.google.com/maps?q=Gedung+Graha'))

    def test_embed_code_is_refused_with_a_clear_message(self):
        res = self.add('<iframe src="https://www.google.com/maps/embed?pb=x"></iframe>')
        self.assertEqual(res.status_code, 400)
        self.assertIn('bukan kode embed', str(res.data['maps_link']))

    def test_clearing_the_link_clears_coordinates(self):
        pk = self.add('-7.78, 110.40').data['id']
        self.client.patch(f'{self.url}{pk}/', {'maps_link': ''}, format='json')
        ev = Event.objects.get(pk=pk)
        self.assertEqual((ev.maps_link, ev.lat, ev.lng), ('', None, None))

    def test_a_legacy_unvalidated_link_is_never_used(self):
        pk = self.add('').data['id']
        Event.objects.filter(pk=pk).update(maps_link='javascript:alert(1)')
        ev = self.client.get(f'/api/invitations/{self.inv.slug}/').data['events'][0]
        self.assertTrue(ev['maps_url'].startswith('https://www.google.com/maps/search/'))
