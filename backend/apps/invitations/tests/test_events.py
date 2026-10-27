"""Events: types, timezones, the single primary event, .ics, and the migration
of existing akad/resepsi rows."""
from datetime import date, datetime, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo

from apps.invitations.models import Event

from .base import APITestBase
from .migration_base import MigrationTestCase

WIB, WITA = ZoneInfo('Asia/Jakarta'), ZoneInfo('Asia/Makassar')


class EventApiTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, active=False)
        self.login(self.owner)
        self.url = f'/api/my/invitations/{self.inv.slug}/events/'

    def add(self, **kw):
        body = {'event_type': 'resepsi', 'start': '2026-12-12T11:00:00+07:00', 'timezone': 'Asia/Jakarta',
                'venue_name': 'Gedung', 'address': 'Jl. Satu', **kw}
        return self.client.post(self.url, body, format='json')

    def test_all_types_and_a_custom_title(self):
        for t in ('akad', 'pemberkatan', 'sakramen', 'resepsi', 'adat', 'ngunduh_mantu', 'lainnya'):
            with self.subTest(t=t):
                self.assertEqual(self.add(event_type=t).status_code, 201)
        res = self.add(event_type='adat', title='Mappacci')
        self.assertEqual(res.data['title'], 'Mappacci')
        self.assertEqual(self.add(event_type='pesta').status_code, 400)

    def test_first_event_is_primary_and_marking_another_moves_it(self):
        first = self.add().data
        self.assertTrue(first['is_primary'])
        second = self.add(is_primary=True).data
        self.assertEqual(list(Event.objects.filter(is_primary=True).values_list('pk', flat=True)), [second['id']])

    def test_the_only_primary_cannot_be_unset(self):
        first = self.add().data
        res = self.client.patch(f"{self.url}{first['id']}/", {'is_primary': False}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_deleting_the_primary_promotes_the_earliest(self):
        a = self.add(order=0).data
        b = self.add(order=1).data
        self.client.delete(f"{self.url}{a['id']}/")
        self.assertTrue(Event.objects.get(pk=b['id']).is_primary)

    def test_offset_times_are_kept_and_naive_times_use_the_event_zone(self):
        with_offset = self.add(start='2026-12-12T08:00:00+08:00', timezone='Asia/Makassar').data
        naive = self.add(start='2026-12-12T08:00:00', timezone='Asia/Makassar').data
        expected = datetime(2026, 12, 12, 0, 0, tzinfo=dt_timezone.utc)
        self.assertEqual(Event.objects.get(pk=with_offset['id']).start, expected)
        self.assertEqual(Event.objects.get(pk=naive['id']).start, expected)

    def test_end_must_follow_start(self):
        res = self.add(start='2026-12-12T11:00:00+07:00', end='2026-12-12T10:00:00+07:00')
        self.assertEqual(res.status_code, 400)
        self.assertIn('end', res.data)

    def test_unknown_timezone_is_refused(self):
        self.assertEqual(self.add(timezone='Europe/Paris').status_code, 400)


class PublicEventAndIcsTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.inv = self.make_invitation(active=True, copy_variant='kristen')
        self.event = Event.objects.create(
            invitation=self.inv, event_type='pemberkatan', start=datetime(2026, 12, 12, 9, 0, tzinfo=WITA),
            timezone='Asia/Makassar', venue_name='Gereja, Makassar', address='Jl. Kartini; No. 2', is_primary=True)

    def test_public_shape(self):
        ev = self.client.get(f'/api/invitations/{self.inv.slug}/').data['events'][0]
        for key in ('event_type', 'title', 'start', 'end', 'timezone', 'maps_url', 'embed_url', 'is_primary'):
            self.assertIn(key, ev)
        self.assertEqual(ev['timezone'], 'Asia/Makassar')

    def test_ics_uses_utc_instants_default_duration_and_escapes_text(self):
        res = self.client.get(f'/api/invitations/{self.inv.slug}/events/{self.event.pk}/calendar.ics')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res['Content-Type'].startswith('text/calendar'))
        body = res.content.decode()
        self.assertIn('DTSTART:20261212T010000Z', body)   # 09:00 WITA
        self.assertIn('DTEND:20261212T030000Z', body)     # + 2 h default
        self.assertIn('X-WR-TIMEZONE:Asia/Makassar', body)
        self.assertIn('SUMMARY:Pemberkatan Nikah — Andini & Bagus', body)
        self.assertIn('LOCATION:Gereja\\, Makassar\\, Jl. Kartini\\; No. 2', body)
        self.assertTrue(all(len(line.encode()) <= 75 for line in body.split('\r\n')))

    def test_ics_uses_end_when_set(self):
        self.event.end = datetime(2026, 12, 12, 12, 30, tzinfo=WITA)
        self.event.save()
        body = self.client.get(f'/api/invitations/{self.inv.slug}/events/{self.event.pk}/calendar.ics').content.decode()
        self.assertIn('DTEND:20261212T043000Z', body)

    def test_ics_hidden_for_drafts(self):
        self.inv.is_active = False
        self.inv.save()
        res = self.client.get(f'/api/invitations/{self.inv.slug}/events/{self.event.pk}/calendar.ics')
        self.assertEqual(res.status_code, 404)


class EventMigrationTests(MigrationTestCase):
    migrate_from = '0030_copy_variant_scripture_gift_moderation'
    migrate_to = '0033_events_cleanup'

    def setUpBeforeMigration(self, apps):
        Event = apps.get_model('invitations', 'Event')
        a = self.make_old_invitation(apps, slug='a')
        Event.objects.create(invitation=a, event_type='resepsi', datetime=datetime(2026, 12, 12, 4, 0, tzinfo=dt_timezone.utc),
                             venue_name='G', address='A', gmaps_url='https://maps.google.com',
                             gmaps_embed_url='https://www.google.com/maps?q=yogyakarta&output=embed', order=1)
        Event.objects.create(invitation=a, event_type='akad', datetime=datetime(2026, 12, 12, 1, 0, tzinfo=dt_timezone.utc),
                             venue_name='M', address='A', gmaps_url='https://goo.gl/maps/abc', order=0)
        b = self.make_old_invitation(apps, slug='b')
        Event.objects.create(invitation=b, event_type='resepsi', datetime=datetime(2026, 12, 12, 4, 0, tzinfo=dt_timezone.utc),
                             venue_name='G', address='A', order=0)

    def test_existing_events_map_over_unchanged(self):
        Event = self.apps.get_model('invitations', 'Event')
        akad = Event.objects.get(invitation__slug='a', event_type='akad')
        resepsi = Event.objects.get(invitation__slug='a', event_type='resepsi')
        only = Event.objects.get(invitation__slug='b')
        self.assertEqual(akad.start, datetime(2026, 12, 12, 1, 0, tzinfo=dt_timezone.utc))
        self.assertEqual({akad.timezone, resepsi.timezone, only.timezone}, {'Asia/Jakarta'})
        self.assertTrue(akad.is_primary and not resepsi.is_primary)
        self.assertTrue(only.is_primary)                       # no akad: earliest becomes primary
        self.assertEqual(akad.maps_link, 'https://goo.gl/maps/abc')
        self.assertEqual(resepsi.maps_link, 'https://www.google.com/maps/search/?api=1&query=yogyakarta')
