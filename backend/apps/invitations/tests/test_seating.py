"""Table seating: the couple sets a table per guest (by hand or in the
import); the guest sees it on their own link, the ushers see and change it,
the welcome screen and the guestbook carry it."""
from unittest import mock

from apps.invitations import usher
from apps.invitations.models import Guest

from .base import APITestBase


class SeatingTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.budi = Guest.objects.create(invitation=self.inv, name='Budi', table='Meja 12')
        self.siti = Guest.objects.create(invitation=self.inv, name='Siti')
        self.login(self.owner)

    def test_couple_sets_a_table_and_imports_one(self):
        res = self.client.patch(f'/api/invitations/{self.inv.slug}/guests/{self.siti.id}/', {'table': '  VIP   A '}, format='json')
        self.assertEqual(res.status_code, 200)
        self.siti.refresh_from_db()
        self.assertEqual(self.siti.table, 'VIP A')
        self.client.post(f'/api/invitations/{self.inv.slug}/guests/import/',
                         {'rows': [{'name': 'Rina', 'table': ' 7 '}, {'name': 'Joko'}]}, format='json')
        self.assertEqual(dict(Guest.objects.filter(name__in=['Rina', 'Joko']).values_list('name', 'table')),
                         {'Rina': '7', 'Joko': ''})

    def test_only_the_guests_own_link_shows_their_table(self):
        self.client.force_authenticate(None)
        url = f'/api/invitations/{self.inv.slug}/'
        self.assertEqual(self.client.get(url, {'g': self.budi.code}).data['seat'], 'Meja 12')
        self.assertNotIn('seat', self.client.get(url, {'g': self.siti.code}).data)
        self.assertNotIn('seat', self.client.get(url).data)

    def test_ushers_see_seat_and_move_guests(self):
        token = self.client.patch(f'/api/my/invitations/{self.inv.slug}/usher/', {'usher_enabled': True}, format='json').data['token']
        self.client.force_authenticate(None)
        base = f'/api/usher/{token}/'
        with mock.patch.object(usher, 'window_open', return_value=True):
            budi = next(g for g in self.client.get(base).data['guests'] if g['name'] == 'Budi')
            self.assertEqual(budi['table'], 'Meja 12')
            # Seated at check-in, moved afterwards; a walk-in gets one too.
            self.client.post(f'{base}checkin/', {'guest_id': self.siti.id, 'table': '3'}, format='json')
            res = self.client.patch(f'{base}guests/{self.siti.id}/', {'table': ' Meja  4 '}, format='json')
            self.assertEqual(res.data['guest']['table'], 'Meja 4')
            self.client.post(f'{base}walkin/', {'name': 'Pak Lurah', 'table': 'VIP'}, format='json')
            arrivals = {a['name']: a['table'] for a in self.client.get(f'{base}arrivals/').data['arrivals']}
        self.assertEqual(arrivals, {'Siti': 'Meja 4', 'Pak Lurah': 'VIP'})
        # Checking in without a table keeps the one the couple set.
        with mock.patch.object(usher, 'window_open', return_value=True):
            self.client.post(f'{base}checkin/', {'guest_id': self.budi.id}, format='json')
        self.budi.refresh_from_db()
        self.assertEqual(self.budi.table, 'Meja 12')
        self.login(self.owner)
        csv = self.client.get(f'/api/invitations/{self.inv.slug}/guestbook.csv').content.decode('utf-8-sig').splitlines()
        self.assertEqual(csv[0].split(',')[:3], ['Nama', 'Grup', 'Meja'])
        self.assertIn('Budi,,Meja 12,', csv[1:][2])
