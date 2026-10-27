"""Theme registry: the backend copy is intact, and couples can only pick active
themes while existing invitations keep whatever theme they already have."""
import copy
import io
import json
from datetime import date, timedelta
from unittest import mock

from django.core.exceptions import ValidationError
from django.core.management import call_command

from apps.invitations import themes
from apps.invitations.models import Invitation
from apps.invitations.admin import InvitationAdminForm

from .base import APITestBase

REAL = themes.entries()


def with_status(status, *ids):
    """Patch the registry so the given ids have `status`, independent of what
    the shipped registry currently says."""
    patched = copy.deepcopy(REAL)
    for tid in ids:
        patched[tid]['status'] = status
    return mock.patch.object(themes, 'entries', return_value=patched)


def with_active(*ids):
    return with_status('active', *ids)


class RegistryCopyTests(APITestBase):
    def test_backend_copy_is_the_generated_file(self):
        raw = json.loads(themes.REGISTRY_PATH.read_text(encoding='utf-8'))
        self.assertIn('_generated', raw, 'theme_registry.json was edited by hand; run `make themes`')
        self.assertEqual(len(REAL), len(raw['themes']), 'duplicate theme ids')

    def test_every_entry_is_well_formed(self):
        for t in REAL.values():
            with self.subTest(theme=t['id']):
                self.assertIn(t['kind'], {'pack', 'legacy'})
                self.assertIn(t['status'], {'active', 'hidden', 'coming'})
                self.assertLessEqual(len(t['id']), Invitation._meta.get_field('theme').max_length)

    def test_all_existing_themes_are_registered_legacy(self):
        legacy = [t for t in REAL.values() if t['kind'] == 'legacy']
        self.assertEqual(len(legacy), 36)
        self.assertTrue(all(t['status'] == 'hidden' for t in legacy))


class ThemeValidationTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.login(self.owner)

    def create(self, **body):
        return self.client.post('/api/my/invitations/', {
            'slug': 'andini-bagus', 'wedding_date': (date.today() + timedelta(days=90)).isoformat(), **body,
        }, format='json')

    def test_create_with_a_hidden_theme_is_refused(self):
        res = self.create(theme='navy-gold')
        self.assertEqual(res.status_code, 400)
        self.assertIn('theme', res.data)

    def test_create_with_an_unknown_theme_is_refused(self):
        self.assertEqual(self.create(theme='does-not-exist').status_code, 400)

    def test_create_with_an_active_theme_works(self):
        with with_active('minimal'):
            res = self.create(theme='minimal')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Invitation.objects.get().theme, 'minimal')

    def test_create_without_a_theme_uses_the_default_only_if_it_is_active(self):
        with with_status('coming', themes.DEFAULT_THEME):
            self.assertEqual(self.create().status_code, 400)
        with with_active(themes.DEFAULT_THEME):
            self.assertEqual(self.create().status_code, 201)

    def test_existing_hidden_theme_is_kept_and_editable(self):
        inv = self.make_invitation(owner=self.owner, active=False, theme='navy-gold')
        res = self.client.patch(f'/api/my/invitations/{inv.slug}/', {'theme': 'navy-gold', 'opening_text': 'Halo'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        inv.refresh_from_db()
        self.assertEqual((inv.theme, inv.opening_text), ('navy-gold', 'Halo'))

    def test_switching_to_another_hidden_theme_is_refused(self):
        inv = self.make_invitation(owner=self.owner, active=False, theme='navy-gold')
        res = self.client.patch(f'/api/my/invitations/{inv.slug}/', {'theme': 'plum-gold'}, format='json')
        self.assertEqual(res.status_code, 400)
        inv.refresh_from_db()
        self.assertEqual(inv.theme, 'navy-gold')

    def test_switching_to_an_active_theme_works(self):
        inv = self.make_invitation(owner=self.owner, active=False, theme='navy-gold')
        with with_active('minimal'):
            res = self.client.patch(f'/api/my/invitations/{inv.slug}/', {'theme': 'minimal'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)

    def test_hidden_theme_invitation_still_renders_publicly(self):
        inv = self.make_invitation(active=True, theme='buginese-blue')
        res = self.client.get(f'/api/invitations/{inv.slug}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['theme'], 'buginese-blue')

    def test_model_rejects_unregistered_ids(self):
        inv = self.make_invitation(theme='navy-gold')
        inv.theme = 'nope'
        with self.assertRaises(ValidationError):
            inv.full_clean()


class AdminFormTests(APITestBase):
    def form(self, instance=None, **data):
        inv_data = {
            'slug': 'admin-made', 'tier': 'free', 'theme': 'navy-gold', 'wedding_date': '2026-12-12',
            'watermark': True, **data,
        }
        return InvitationAdminForm(data=inv_data, instance=instance)

    def test_admin_cannot_put_a_new_invitation_on_a_hidden_theme(self):
        form = self.form()
        self.assertFalse(form.is_valid())
        self.assertIn('theme', form.errors)

    def test_admin_can_keep_an_existing_hidden_theme(self):
        inv = self.make_invitation(slug='admin-made', theme='navy-gold')
        form = self.form(instance=inv)
        self.assertNotIn('theme', form.errors)


class SeedFromRegistryTests(APITestBase):
    def test_seed_creates_a_demo_for_every_renderable_registry_entry(self):
        call_command('seed_demos', stdout=io.StringIO())
        for t in REAL.values():
            if t.get('demoSlug') and not (t['kind'] == 'pack' and t['status'] == 'coming'):
                with self.subTest(theme=t['id']):
                    self.assertEqual(Invitation.objects.get(slug=t['demoSlug']).theme, t['id'])
