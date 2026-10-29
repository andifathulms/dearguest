"""The theme page's copy-variant toggle: ?variant= changes demo invitations
only, never a couple's own."""
from datetime import datetime, timezone
from unittest import mock

from apps.invitations.models import Event

from .base import APITestBase


class DemoVariantTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.demo = self.make_invitation(slug='demo-taman-sage', copy_variant='umum', opening_text='Teks demo')
        self.couple = self.make_invitation(slug='andini-bagus', copy_variant='islam', opening_text='Teks kami')
        for inv in (self.demo, self.couple):
            Event.objects.create(invitation=inv, event_type='akad', venue_name='-', address='-',
                                 start=datetime(2026, 12, 12, 1, tzinfo=timezone.utc), is_primary=True)
            Event.objects.create(invitation=inv, event_type='resepsi', venue_name='-', address='-',
                                 start=datetime(2026, 12, 12, 4, tzinfo=timezone.utc))
        patcher = mock.patch('apps.invitations.themes.is_demo_slug', side_effect=lambda s: s == 'demo-taman-sage')
        patcher.start()
        self.addCleanup(patcher.stop)

    def get(self, slug, variant):
        return self.client.get(f'/api/invitations/{slug}/', {'variant': variant}).data

    def test_demo_follows_the_toggle(self):
        expected = {'islam': 'akad', 'kristen': 'pemberkatan', 'katolik': 'sakramen', 'umum': 'akad'}
        for variant, ceremony in expected.items():
            with self.subTest(variant=variant):
                data = self.get('demo-taman-sage', variant)
                self.assertEqual(data['copy_variant'], variant)
                self.assertEqual([e['event_type'] for e in data['events']], [ceremony, 'resepsi'])
                self.assertEqual(data['opening_text'], '')   # the variant's own greeting shows

    def test_couples_invitations_and_unknown_variants_are_untouched(self):
        data = self.get('andini-bagus', 'kristen')
        self.assertEqual((data['copy_variant'], data['opening_text']), ('islam', 'Teks kami'))
        self.assertEqual([e['event_type'] for e in data['events']], ['akad', 'resepsi'])
        data = self.get('demo-taman-sage', 'bukan-varian')
        self.assertEqual((data['copy_variant'], data['opening_text']), ('umum', 'Teks demo'))
