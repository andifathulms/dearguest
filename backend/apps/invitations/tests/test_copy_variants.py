"""Copy variants: data integrity, validation, overrides, and that existing
invitations keep today's (islam, no scripture) behaviour after migration."""
from datetime import date, timedelta

from apps.invitations import copy
from apps.invitations.models import Invitation

from .base import APITestBase
from .migration_base import MigrationTestCase


class CopyDataTests(APITestBase):
    def test_variants_and_lookup_order(self):
        self.assertEqual(copy.variants(), ['islam', 'kristen', 'katolik', 'umum'])
        # variant key wins, then base
        self.assertEqual(copy.t('countdown.passed', 'islam'), 'Alhamdulillah, hari bahagia telah tiba')
        self.assertEqual(copy.t('countdown.passed', 'umum'), 'Hari bahagia telah tiba')
        self.assertEqual(copy.t('events.title', 'kristen'), 'Rangkaian Acara')
        self.assertEqual(copy.t('share.text', 'umum', greeting='Halo', bride='A', groom='B', url='u'),
                         'Halo, kami mengundang Anda ke pernikahan A & B. Lihat undangan kami di: u')

    def test_islamic_phrases_only_in_islam(self):
        for variant in ('kristen', 'katolik', 'umum'):
            for key in ('countdown.passed', 'rsvp.thanks', 'share.greeting', 'greeting.default', 'closing.default'):
                text = copy.t(key, variant)
                for phrase in ('Alhamdulillah', 'Jazakumullah', 'Assalamu', 'Wassalamu'):
                    self.assertNotIn(phrase, text, f'{variant}/{key}')

    def test_umum_has_no_religious_text(self):
        v = copy._copy()['locales']['id']['variants']['umum']
        self.assertEqual(v['_scripture'], '')
        self.assertEqual(v['_blessing'], '')

    def test_scripture_entries_are_unverified_and_sourced(self):
        for e in copy._scripture().values():
            self.assertIs(e['verified'], False)
            self.assertTrue(e['source'])
        self.assertTrue(copy.scripture('ar-rum-30-21')['arabic'])

    def test_event_label_prefers_the_couples_title(self):
        self.assertEqual(copy.event_label('adat', 'islam'), 'Upacara Adat')
        self.assertEqual(copy.event_label('adat', 'islam', title='Mappacci'), 'Mappacci')


class VariantApiTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.login(self.owner)

    def create(self, **body):
        from .test_theme_registry import with_active
        with with_active('minimal'):
            return self.client.post('/api/my/invitations/', {
                'slug': 'andini-bagus', 'theme': 'minimal',
                'wedding_date': (date.today() + timedelta(days=90)).isoformat(), **body,
            }, format='json')

    def test_onboarding_variant_is_stored(self):
        self.assertEqual(self.create(copy_variant='kristen').status_code, 201)
        self.assertEqual(Invitation.objects.get().copy_variant, 'kristen')

    def test_new_invitations_default_to_umum_with_default_scripture(self):
        self.assertEqual(self.create().status_code, 201)
        inv = Invitation.objects.get()
        self.assertEqual((inv.copy_variant, inv.scripture_mode), ('umum', 'default'))

    def test_unknown_variant_is_refused(self):
        self.assertEqual(self.create(copy_variant='pastafarian').status_code, 400)

    def test_overrides_are_stored_verbatim_and_returned_as_text(self):
        inv = self.make_invitation(owner=self.owner)
        payload = {
            'copy_variant': 'katolik', 'scripture_mode': 'custom',
            'scripture_ref': 'Kolose 3:14', 'scripture_text': '<b>kasih</b> <script>x</script>',
            'opening_text': 'Salam <i>hangat</i>',
        }
        res = self.client.patch(f'/api/my/invitations/{inv.slug}/', payload, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        public = self.client.get(f'/api/invitations/{inv.slug}/').data
        for k, v in payload.items():
            self.assertEqual(public[k], v)

    def test_custom_scripture_needs_a_reference(self):
        inv = self.make_invitation(owner=self.owner)
        res = self.client.patch(f'/api/my/invitations/{inv.slug}/', {'scripture_mode': 'custom'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('scripture_ref', res.data)


class ExistingInvitationsMigrationTests(MigrationTestCase):
    migrate_from = '0029_invitation_photo_filter'
    migrate_to = '0030_copy_variant_scripture_gift_moderation'

    def setUpBeforeMigration(self, apps):
        self.make_old_invitation(apps, slug='lama')

    def test_existing_rows_become_islam_without_scripture(self):
        inv = self.apps.get_model('invitations', 'Invitation').objects.get(slug='lama')
        self.assertEqual((inv.copy_variant, inv.scripture_mode), ('islam', 'none'))
