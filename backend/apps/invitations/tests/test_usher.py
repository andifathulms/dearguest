"""Mode Penerima Tamu: the token link, its time window, check-in, walk-ins,
souvenirs, the welcome screen feed and the guestbook export."""
from datetime import date, datetime, timedelta, timezone as dt_tz
from unittest import mock

from apps.invitations import usher
from apps.invitations.models import RSVP, Event, Guest

from .base import APITestBase


class UsherTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.day = self.inv.wedding_date
        Event.objects.create(invitation=self.inv, event_type='akad', venue_name='Masjid', address='-', is_primary=True,
                             start=datetime(self.day.year, self.day.month, self.day.day, 1, tzinfo=dt_tz.utc), groups=['Keluarga'])
        self.budi = Guest.objects.create(invitation=self.inv, name='Budi', group='Keluarga', max_pax=3, whatsapp='6281200000001')
        self.siti = Guest.objects.create(invitation=self.inv, name='Siti', group='Kantor')
        RSVP.objects.create(invitation=self.inv, guest=self.budi, guest_name='Budi', attending=True, pax=2, wishes='Selamat')
        self.login(self.owner)
        self.token = self.client.patch(f'/api/my/invitations/{self.inv.slug}/usher/', {'usher_enabled': True, 'souvenir_stock': 1},
                                       format='json').data['token']
        self.client.force_authenticate(None)   # from here on: an usher, not logged in
        self.base = f'/api/usher/{self.token}/'
        self.on_the_day = mock.patch.object(usher, 'window_open', return_value=True)
        self.on_the_day.start()
        self.addCleanup(self.on_the_day.stop)

    def test_home_lists_guests_without_phone_numbers(self):
        res = self.client.get(self.base)
        self.assertEqual(res.status_code, 200)
        budi = next(g for g in res.data['guests'] if g['name'] == 'Budi')
        self.assertEqual((budi['rsvp'], budi['sessions']), ({'attending': True, 'pax': 2}, ['Akad Nikah']))
        self.assertNotIn('6281200000001', str(res.content))
        self.assertEqual(res.data['stats']['expected_pax'], 2 + 1)

    def test_check_in_by_scanned_code_then_again(self):
        res = self.client.post(f'{self.base}checkin/', {'code': self.budi.code.lower(), 'arrived_pax': 2, 'envelope_no': ' 017 ',
                                                        'souvenir': True}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data['already'])
        self.budi.refresh_from_db()
        self.assertEqual((self.budi.checked_in, self.budi.arrived_pax, self.budi.envelope_no, self.budi.souvenir_given),
                         (True, 2, '017', True))
        self.assertEqual((res.data['stats']['arrived_pax'], res.data['stats']['souvenirs_left']), (2, 0))
        again = self.client.post(f'{self.base}checkin/', {'guest_id': self.budi.id, 'arrived_pax': 9}, format='json')
        self.assertTrue(again.data['already'])
        self.budi.refresh_from_db()
        self.assertEqual(self.budi.arrived_pax, 2)
        self.assertEqual(self.client.post(f'{self.base}checkin/', {'code': 'NOPE99'}, format='json').status_code, 404)

    def test_edit_and_undo(self):
        self.client.post(f'{self.base}checkin/', {'guest_id': self.siti.id}, format='json')
        res = self.client.patch(f'{self.base}guests/{self.siti.id}/', {'envelope_no': '22', 'arrived_pax': 99}, format='json')
        self.assertEqual((res.data['guest']['envelope_no'], res.data['guest']['arrived_pax']), ('22', usher.MAX_ARRIVED))
        self.client.post(f'{self.base}guests/{self.siti.id}/undo/')
        self.siti.refresh_from_db()
        self.assertEqual((self.siti.checked_in, self.siti.envelope_no, self.siti.arrived_pax), (False, '', None))

    def test_walk_in_is_added_checked_in_and_undo_removes_it(self):
        res = self.client.post(f'{self.base}walkin/', {'name': '  Pak  Lurah ', 'arrived_pax': 2}, format='json')
        self.assertEqual(res.status_code, 201)
        walk_in = Guest.objects.get(name='Pak Lurah')
        self.assertTrue(walk_in.is_walk_in and walk_in.checked_in)
        self.assertEqual(self.client.post(f'{self.base}walkin/', {'name': ' '}, format='json').status_code, 400)
        # Walk-ins don't count as expected guests in the caterer's numbers.
        self.login(self.owner)
        self.assertEqual(self.client.get(f'/api/invitations/{self.inv.slug}/headcount/').data['total']['invited'], 2)
        self.client.force_authenticate(None)
        self.client.post(f'{self.base}guests/{walk_in.id}/undo/')
        self.assertFalse(Guest.objects.filter(name='Pak Lurah').exists())

    def test_arrivals_feed_newest_first(self):
        for g in (self.budi, self.siti):
            self.client.post(f'{self.base}checkin/', {'guest_id': g.id}, format='json')
        names = [a['name'] for a in self.client.get(f'{self.base}arrivals/').data['arrivals']]
        self.assertEqual(names, ['Siti', 'Budi'])

    def test_link_is_closed_outside_the_window_except_for_the_couple(self):
        self.on_the_day.stop()
        with mock.patch.object(usher, 'window_open', return_value=False):
            self.assertEqual(self.client.get(self.base).status_code, 403)
            self.login(self.owner)
            self.assertEqual(self.client.get(self.base).status_code, 200)
        self.on_the_day.start()

    def test_window_spans_the_event_days(self):
        self.on_the_day.stop()
        self.addCleanup(self.on_the_day.start)
        start, end = usher.window(self.inv)
        self.assertEqual((start, end), (self.day - timedelta(days=2), self.day + timedelta(days=2)))
        self.assertTrue(usher.window_open(self.inv, today=self.day + timedelta(days=2)))
        self.assertFalse(usher.window_open(self.inv, today=self.day + timedelta(days=3)))

    def test_switched_off_rotated_or_wrong_token_is_404(self):
        self.assertEqual(self.client.get('/api/usher/short/').status_code, 404)
        self.login(self.owner)
        new = self.client.patch(f'/api/my/invitations/{self.inv.slug}/usher/', {'rotate': True}, format='json').data['token']
        self.assertNotEqual(new, self.token)
        self.assertEqual(self.client.get(self.base).status_code, 404)
        self.client.patch(f'/api/my/invitations/{self.inv.slug}/usher/', {'usher_enabled': False}, format='json')
        self.assertEqual(self.client.get(f'/api/usher/{new}/').status_code, 404)

    def test_personal_link_shows_its_qr_only_when_venue_mode_is_on(self):
        url = f'/api/invitations/{self.inv.slug}/'
        self.assertTrue(self.client.get(f'{url}?g={self.budi.code}').data['checkin_qr'])
        self.assertNotIn('checkin_qr', self.client.get(url).data)

    def test_site_paths_cannot_be_invitation_slugs(self):
        self.login(self.make_user('baru'))
        self.assertFalse(self.client.get('/api/my/slug-check/?slug=penerima').data['available'])
        self.assertEqual(self.client.post('/api/my/invitations/', {'slug': 'penerima', 'wedding_date': '2027-01-01'},
                                          format='json').status_code, 400)

    def test_guestbook_export(self):
        self.client.post(f'{self.base}checkin/', {'guest_id': self.budi.id, 'envelope_no': '=1+1'}, format='json')
        self.login(self.owner)
        res = self.client.get(f'/api/invitations/{self.inv.slug}/guestbook.csv')
        body = res.content.decode('utf-8-sig')
        self.assertIn('Budi', body)
        self.assertIn("'=1+1", body)   # formula guard
        self.assertNotIn('Siti', body)
