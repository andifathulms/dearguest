"""Sending invitations: guest import from messy pastes, bulk add keeping the
group, the couple's WhatsApp templates, and the queue's sent marker."""
from apps.invitations.models import Guest, normalise_whatsapp

from .base import APITestBase


class ImportTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.login(self.owner)
        self.url = f'/api/invitations/{self.inv.slug}/guests/import/'

    def post(self, rows):
        return self.client.post(self.url, {'rows': rows}, format='json')

    def test_messy_rows_are_normalised_and_bad_ones_reported(self):
        Guest.objects.create(invitation=self.inv, name='Sudah Ada', whatsapp='6281200000001')
        res = self.post([
            {'name': '  Budi   Santoso ', 'whatsapp': '+62 812-3456-7890', 'group': ' Kantor ', 'max_pax': '2'},
            {'name': 'Siti', 'whatsapp': '0812 3456 7891', 'max_pax': 'dua'},
            {'name': 'Joko', 'whatsapp': '81234567892'},
            {'name': '', 'whatsapp': ''},                      # blank: silently dropped
            {'name': '', 'whatsapp': '0812'},                  # no name: reported
            {'name': 'Rina', 'whatsapp': '12'},                # not a number
            {'name': 'Budi Kedua', 'whatsapp': '6281234567890'},  # same number as Budi
            {'name': 'siti', 'whatsapp': ''},                  # same name as Siti
            {'name': 'Lama', 'whatsapp': '081200000001'},      # number already on the list
            {'name': 'Tanpa Nomor'},
            'not a dict',
        ])
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['created'], 4)
        reasons = {r['row']: r['reason'] for r in res.data['skipped']}
        self.assertEqual(reasons, {
            5: 'Nama kosong', 6: 'Nomor WhatsApp tidak valid', 7: 'Nomor sudah ada',
            8: 'Nama sudah ada', 9: 'Nomor sudah ada',
        })
        budi = Guest.objects.get(invitation=self.inv, name='Budi Santoso')
        self.assertEqual((budi.whatsapp, budi.group, budi.max_pax), ('6281234567890', 'Kantor', 2))
        self.assertEqual(len(budi.code), 6)
        self.assertIsNone(Guest.objects.get(name='Siti').max_pax)
        self.assertEqual(Guest.objects.get(name='Joko').whatsapp, '6281234567892')

    def test_only_the_owner_can_import_and_size_is_capped(self):
        self.assertEqual(self.post([{'name': 'A'} for _ in range(1001)]).status_code, 400)
        self.assertEqual(self.post([]).status_code, 400)
        self.login(self.make_user('other'))
        self.assertEqual(self.post([{'name': 'A'}]).status_code, 403)
        self.assertFalse(Guest.objects.exists())

    def test_bulk_add_keeps_the_group(self):
        res = self.client.post(f'/api/invitations/{self.inv.slug}/guests/',
                               {'names': ['Andi', 'Bela'], 'group': 'Keluarga'}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(set(Guest.objects.values_list('group', flat=True)), {'Keluarga'})

    def test_queue_marks_a_guest_sent(self):
        guest = Guest.objects.create(invitation=self.inv, name='Andi')
        url = f'/api/invitations/{self.inv.slug}/guests/{guest.id}/'
        res = self.client.patch(url, {'sent_at': '2026-10-28T10:00:00Z'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.data['sent_at'])
        res = self.client.patch(url, {'sent_at': None}, format='json')   # "Batalkan"
        self.assertIsNone(res.data['sent_at'])


class TemplateTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.login(self.owner)
        self.url = f'/api/my/invitations/{self.inv.slug}/'

    def test_couple_saves_templates_and_blank_falls_back_to_default(self):
        res = self.client.patch(self.url, {'wa_templates': {
            'active': 'casual', 'casual': 'Halo {nama}! {link}', 'formal': '',
        }}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['wa_templates'], {'active': 'casual', 'casual': 'Halo {nama}! {link}'})
        self.assertTrue(res.data['features']['wa_blast'])

    def test_bad_templates_are_rejected(self):
        for bad in ({'active': 'kasar'}, {'other': 'x'}, {'formal': 'x' * 2001}, {'formal': 5}, ['x']):
            with self.subTest(bad=str(bad)[:30]):
                res = self.client.patch(self.url, {'wa_templates': bad}, format='json')
                self.assertEqual(res.status_code, 400)


class NormaliserCases(APITestBase):
    """The same cases are checked against the JS port (src/utils/whatsapp.test.js)."""
    CASES = {
        '0812-3456-7890': '6281234567890', '+62 812 3456 7890': '6281234567890',
        '6281234567890': '6281234567890', '81234567890': '6281234567890',
        '(0812) 3456 789': '628123456789', '': '', '12': '', 'abc': '',
        '+1 415 555 0100': '14155550100', '0' * 20: '',
    }

    def test_cases(self):
        for raw, expected in self.CASES.items():
            self.assertEqual(normalise_whatsapp(raw), expected, raw)
