"""Events per guest group (sessions, family-only akad) and the headcount."""
from datetime import datetime, timezone

from apps.invitations import og
from apps.invitations.models import RSVP, Event, Guest

from .base import APITestBase


def at(hour):
    return datetime(2026, 12, 12, hour, tzinfo=timezone.utc)


class AudienceTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.akad = Event.objects.create(invitation=self.inv, event_type='akad', venue_name='Masjid', address='-',
                                         start=at(1), is_primary=True, groups=['Keluarga'], order=0)
        self.sesi1 = Event.objects.create(invitation=self.inv, event_type='resepsi', title='Sesi 1', venue_name='Gedung',
                                          address='-', start=at(4), groups=['keluarga', 'Kantor'], order=1)
        self.sesi2 = Event.objects.create(invitation=self.inv, event_type='resepsi', title='Sesi 2', venue_name='Gedung',
                                          address='-', start=at(6), groups=['Teman'], order=2)
        self.ngunduh = Event.objects.create(invitation=self.inv, event_type='ngunduh_mantu', venue_name='Rumah',
                                            address='-', start=at(9), order=3)
        self.family = Guest.objects.create(invitation=self.inv, name='Om Bambang', group=' KELUARGA ', max_pax=4)
        self.office = Guest.objects.create(invitation=self.inv, name='Rina', group='Kantor', max_pax=2)
        self.friend = Guest.objects.create(invitation=self.inv, name='Agus', group='Teman')

    def titles(self, code=None):
        url = f'/api/invitations/{self.inv.slug}/' + (f'?g={code}' if code else '')
        events = self.client.get(url).data['events']
        self.assertTrue(all('groups' not in e for e in events), 'group names must not reach guests')
        return [e['title'] or e['event_type'] for e in events]

    def test_each_link_sees_its_own_events(self):
        self.assertEqual(self.titles(self.family.code), ['akad', 'Sesi 1', 'ngunduh_mantu'])
        self.assertEqual(self.titles(self.office.code.lower()), ['Sesi 1', 'ngunduh_mantu'])
        self.assertEqual(self.titles(self.friend.code), ['Sesi 2', 'ngunduh_mantu'])
        self.assertEqual(self.titles(), ['ngunduh_mantu'])
        self.assertEqual(self.titles('NOPE99'), ['ngunduh_mantu'])

    def test_calendar_file_follows_the_same_rule(self):
        url = f'/api/invitations/{self.inv.slug}/events/{self.akad.pk}/calendar.ics'
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.get(f'{url}?g={self.office.code}').status_code, 404)
        self.assertEqual(self.client.get(f'{url}?g={self.family.code}').status_code, 200)
        self.login(self.owner)
        self.assertEqual(self.client.get(url).status_code, 200)

    def test_link_preview_uses_the_guests_first_event(self):
        self.assertIn('Akad', og.preview_data(self.inv, self.family)['event'])
        self.assertIn('Sesi 2', og.preview_data(self.inv, self.friend)['event'])
        self.assertIn('Ngunduh', og.preview_data(self.inv, None)['event'])

    def test_editor_cleans_group_names(self):
        self.login(self.owner)
        url = f'/api/my/invitations/{self.inv.slug}/events/{self.sesi2.pk}/'
        res = self.client.patch(url, {'groups': [' Teman  Kuliah ', 'teman kuliah', '', 'Kantor']}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['groups'], ['Teman Kuliah', 'Kantor'])
        self.assertEqual(self.client.patch(url, {'groups': 'Kantor'}, format='json').status_code, 400)

    def test_headcount_per_event_and_group(self):
        RSVP.objects.create(invitation=self.inv, guest=self.family, guest_name='Om', attending=True, pax=3)
        RSVP.objects.create(invitation=self.inv, guest=self.friend, guest_name='Agus', attending=False)
        RSVP.objects.create(invitation=self.inv, guest_name='Tamu umum', attending=True, pax=2)   # general link
        self.login(self.owner)
        data = self.client.get(f'/api/invitations/{self.inv.slug}/headcount/').data
        events = {e['title'] or e['event_type']: e for e in data['events']}
        self.assertEqual((events['akad']['invited'], events['akad']['attending_pax'], events['akad']['estimate_max']), (1, 3, 3))
        sesi1 = events['Sesi 1']   # family (3 coming) + office (no answer, up to 2)
        self.assertEqual((sesi1['invited'], sesi1['attending_pax'], sesi1['awaiting_pax'], sesi1['estimate_max']), (2, 3, 2, 5))
        self.assertEqual((events['Sesi 2']['declined'], events['Sesi 2']['estimate_max']), (1, 0))
        self.assertEqual(events['ngunduh_mantu']['attending_pax'], 5)   # everyone's event counts the general answer
        self.assertEqual([g['name'] for g in data['groups']], ['Kantor', 'KELUARGA', 'Teman'])
        self.assertEqual(data['total']['estimate_max'], 3 + 2 + 2)
