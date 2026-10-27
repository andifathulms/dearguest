"""Couple profiles: structured parents (Alm./Almh.), child order, Instagram,
the gift shipping address, and the migration that splits `*_parents`."""
from apps.invitations.models import Couple

from .base import APITestBase
from .migration_base import MigrationTestCase


class CoupleProfileApiTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, active=True)
        self.login(self.owner)
        self.url = f'/api/my/invitations/{self.inv.slug}/couple/'

    def put(self, **kw):
        body = {'bride_name': 'Andini', 'bride_parents': '', 'groom_name': 'Bagus', 'groom_parents': '', **kw}
        return self.client.put(self.url, body, format='multipart')

    def test_structured_parents_and_flags_round_trip_to_the_public_api(self):
        res = self.put(bride_father='Suryadi', bride_father_deceased='true', bride_mother='Lestari',
                       bride_child_order='pertama', groom_mother='Wulandari', groom_mother_deceased='true')
        self.assertEqual(res.status_code, 200, res.data)
        couple = self.client.get(f'/api/invitations/{self.inv.slug}/').data['couple']
        self.assertEqual(couple['bride_father'], 'Suryadi')
        self.assertTrue(couple['bride_father_deceased'])
        self.assertFalse(couple['bride_mother_deceased'])
        self.assertEqual(couple['bride_child_order'], 'pertama')
        self.assertTrue(couple['groom_mother_deceased'])

    def test_instagram_accepts_handle_at_and_profile_url(self):
        for raw in ('andini.s', '@andini.s', 'https://www.instagram.com/andini.s/?igsh=abc', 'instagram.com/andini.s'):
            with self.subTest(raw=raw):
                self.assertEqual(self.put(bride_instagram=raw).status_code, 200)
                self.assertEqual(Couple.objects.get(invitation=self.inv).bride_instagram, 'andini.s')

    def test_instagram_rejects_anything_else(self):
        for raw in ('javascript:alert(1)', 'andini s', 'https://evil.example/andini'):
            with self.subTest(raw=raw):
                res = self.put(bride_instagram=raw)
                self.assertEqual(res.status_code, 400)
                self.assertIn('bride_instagram', res.data)

    def test_gift_address_is_public_when_set(self):
        res = self.client.patch(f'/api/my/invitations/{self.inv.slug}/',
                                {'gift_recipient': 'Andini', 'gift_address': 'Jl. Melati 3\nYogyakarta', 'gift_phone': '0812'},
                                format='json')
        self.assertEqual(res.status_code, 200, res.data)
        data = self.client.get(f'/api/invitations/{self.inv.slug}/').data
        self.assertEqual((data['gift_recipient'], data['gift_address'], data['gift_phone']),
                         ('Andini', 'Jl. Melati 3\nYogyakarta', '0812'))


class ParentsSplitMigrationTests(MigrationTestCase):
    migrate_from = '0034_couple_family_instagram'
    migrate_to = '0035_couple_family_data'

    CASES = {
        'a': ('Bapak Suryadi & Ibu Lestari', 'Bpk. H. Ahmad (Alm.) & Ibu Siti Aminah (Almh)'),
        'b': ('-', 'Keluarga Besar Hartono'),
    }

    def setUpBeforeMigration(self, apps):
        Couple = apps.get_model('invitations', 'Couple')
        for slug, (bride, groom) in self.CASES.items():
            inv = self.make_old_invitation(apps, slug=slug)
            Couple.objects.create(invitation=inv, bride_name='A', groom_name='B', bride_parents=bride, groom_parents=groom)

    def test_parents_split_with_late_flags(self):
        Couple = self.apps.get_model('invitations', 'Couple')
        a = Couple.objects.get(invitation__slug='a')
        self.assertEqual((a.bride_father, a.bride_mother), ('Suryadi', 'Lestari'))
        self.assertFalse(a.bride_father_deceased or a.bride_mother_deceased)
        self.assertEqual((a.groom_father, a.groom_mother), ('H. Ahmad', 'Siti Aminah'))
        self.assertTrue(a.groom_father_deceased and a.groom_mother_deceased)
        self.assertEqual(a.bride_parents, 'Bapak Suryadi & Ibu Lestari')  # free text kept as fallback

    def test_unparseable_text_is_left_alone(self):
        Couple = self.apps.get_model('invitations', 'Couple')
        b = Couple.objects.get(invitation__slug='b')
        self.assertEqual((b.bride_father, b.groom_father, b.groom_mother), ('', '', ''))
        self.assertEqual(b.groom_parents, 'Keluarga Besar Hartono')
