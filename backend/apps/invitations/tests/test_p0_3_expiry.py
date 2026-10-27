"""p0-3: expires_at follows wedding_date and never lands before the wedding."""
import io
from datetime import date, timedelta

from django.core.management import call_command

from apps.invitations.models import Invitation, EXPIRY_DAYS_AFTER_WEDDING

from .base import APITestBase

GRACE = timedelta(days=EXPIRY_DAYS_AFTER_WEDDING)


class ExpiryRecomputeTests(APITestBase):
    def test_changing_the_date_in_the_editor_moves_expiry(self):
        owner = self.make_user()
        inv = self.make_invitation(owner=owner, wedding_date=date.today())
        new_date = date.today() + timedelta(days=180)
        self.login(owner)
        res = self.client.patch(f'/api/my/invitations/{inv.slug}/', {'wedding_date': new_date.isoformat()}, format='json')
        self.assertEqual(res.status_code, 200)
        inv.refresh_from_db()
        self.assertEqual(inv.expires_at, new_date + GRACE)

    def test_update_fields_save_persists_the_new_expiry(self):
        inv = self.make_invitation(wedding_date=date(2026, 1, 1))
        inv.wedding_date = date(2026, 7, 1)
        inv.save(update_fields=['wedding_date'])
        inv.refresh_from_db()
        self.assertEqual(inv.expires_at, date(2026, 7, 1) + GRACE)

    def test_expiry_is_never_before_the_day_after_the_wedding(self):
        inv = self.make_invitation(wedding_date=date(2026, 7, 1))
        inv.expires_at = date(2026, 6, 1)
        inv.save()
        inv.refresh_from_db()
        self.assertEqual(inv.expires_at, date(2026, 7, 2))

    def test_a_manual_extension_survives_unrelated_saves(self):
        inv = self.make_invitation(wedding_date=date(2026, 7, 1))
        inv.expires_at = date(2027, 7, 1)
        inv.save()
        inv.opening_text = 'Halo'
        inv.save()
        inv.refresh_from_db()
        self.assertEqual(inv.expires_at, date(2027, 7, 1))


class ExpiryReportCommandTests(APITestBase):
    def setUp(self):
        super().setUp()
        wd = date(2026, 7, 1)
        self.ok = self.make_invitation(slug='ok', wedding_date=wd)
        self.extended = self.make_invitation(slug='extended', wedding_date=wd)
        self.broken = self.make_invitation(slug='broken', wedding_date=wd)
        # Bypass save() to simulate rows written before the fix.
        Invitation.objects.filter(pk=self.extended.pk).update(expires_at=wd + timedelta(days=365))
        Invitation.objects.filter(pk=self.broken.pk).update(expires_at=wd - timedelta(days=30))

    def run_cmd(self, *args):
        out = io.StringIO()
        call_command('check_expiry', *args, stdout=out)
        return out.getvalue()

    def test_report_mode_lists_both_groups_and_changes_nothing(self):
        report = self.run_cmd()
        self.assertIn('extended', report)
        self.assertIn('broken', report)
        self.assertNotIn(' ok ', report)
        self.broken.refresh_from_db()
        self.assertEqual(self.broken.expires_at, date(2026, 6, 1))

    def test_apply_fixes_only_rows_that_expire_before_the_wedding(self):
        self.run_cmd('--apply')
        self.broken.refresh_from_db()
        self.extended.refresh_from_db()
        self.assertEqual(self.broken.expires_at, date(2026, 7, 1) + GRACE)
        self.assertEqual(self.extended.expires_at, date(2027, 7, 1))
