"""Admin hardening: its own path, a TOTP second factor, login lockout and an
audit trail for staff actions."""
from django.contrib.admin.models import LogEntry
from django.contrib.auth.models import User
from django.test import Client, override_settings
from django.urls import reverse
from django_otp.oath import totp
from django_otp.plugins.otp_totp.models import TOTPDevice

from apps.invitations.models import Invitation

from .base import APITestBase

PASSWORD = 'x-Strong-pass-91'


class AdminSecurityTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.staff = User.objects.create_user('staf', password=PASSWORD, is_staff=True, is_superuser=True)
        self.web = Client()
        self.login_url = reverse('admin:login')
        self.index = reverse('admin:index')

    def post_login(self, password=PASSWORD, token='', device=''):
        return self.web.post(self.login_url, {'username': 'staf', 'password': password, 'otp_token': token,
                                              'otp_device': device, 'next': self.index})

    @override_settings(ADMIN_REQUIRE_OTP=True)
    def test_password_alone_is_not_enough(self):
        self.post_login()
        self.assertNotEqual(self.web.get(self.index).status_code, 200)

    @override_settings(ADMIN_REQUIRE_OTP=True)
    def test_password_and_totp_get_in(self):
        device = TOTPDevice.objects.create(user=self.staff, name='admin', confirmed=True)
        code = str(totp(device.bin_key, device.step, device.t0, device.digits, device.drift)).zfill(6)
        res = self.post_login(token=code, device=device.persistent_id)
        self.assertEqual(res.status_code, 302)
        self.assertEqual(self.web.get(self.index).status_code, 200)

    @override_settings(ADMIN_REQUIRE_OTP=False)
    def test_five_failures_lock_the_login_out(self):
        for _ in range(5):
            self.assertEqual(self.post_login(password='salah').status_code, 200)
        self.assertEqual(self.post_login().status_code, 429)   # even the right password, for 15 minutes

    def test_admin_path_comes_from_settings(self):
        from django.conf import settings
        self.assertTrue(self.index.startswith('/' + settings.ADMIN_URL))

    @override_settings(ADMIN_REQUIRE_OTP=False)
    def test_bulk_actions_leave_an_audit_trail(self):
        inv = self.make_invitation(slug='aktifkan', active=False)
        self.web.force_login(self.staff)
        changelist = reverse('admin:invitations_invitation_changelist')
        with self.assertLogs('dearguest.audit', 'INFO') as logs:
            self.web.post(changelist, {'action': 'activate_invitations', '_selected_action': [inv.pk]})
        inv.refresh_from_db()
        self.assertTrue(inv.is_active)
        entry = LogEntry.objects.get(object_id=str(inv.pk))
        self.assertEqual((entry.user, entry.get_change_message()), (self.staff, 'Diaktifkan'))
        self.assertIn('admin action', logs.output[0])
        with self.assertLogs('dearguest.audit', 'INFO') as logs:
            self.web.post(changelist, {'action': 'delete_selected', '_selected_action': [inv.pk], 'post': 'yes'})
        self.assertFalse(Invitation.objects.filter(pk=inv.pk).exists())
        self.assertIn('admin delete', logs.output[0])
