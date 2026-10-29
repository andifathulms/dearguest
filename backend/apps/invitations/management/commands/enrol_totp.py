"""Give a staff account a TOTP device for the admin's second factor.

    python manage.py enrol_totp <username> [--reset]

Prints an otpauth:// link and a QR code to scan with an authenticator app
(Google Authenticator, Aegis, 1Password...). Run it on the server; the
secret is never stored anywhere else."""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django_otp.plugins.otp_totp.models import TOTPDevice


class Command(BaseCommand):
    help = 'Enrol a staff user for TOTP (admin second factor).'

    def add_arguments(self, parser):
        parser.add_argument('username')
        parser.add_argument('--reset', action='store_true', help='Remove existing devices first (lost phone).')

    def handle(self, username, reset=False, **options):
        user = User.objects.filter(username=username, is_staff=True).first()
        if not user:
            raise CommandError(f'No staff user "{username}".')
        devices = TOTPDevice.objects.filter(user=user)
        if devices.exists() and not reset:
            raise CommandError('Already enrolled. Use --reset to replace the device (e.g. a lost phone).')
        devices.delete()
        device = TOTPDevice.objects.create(user=user, name='admin', confirmed=True)
        self.stdout.write(device.config_url)
        try:
            import io
            import qrcode
            qr = qrcode.QRCode(border=1)
            qr.add_data(device.config_url)
            out = io.StringIO()
            qr.print_ascii(out=out, invert=True)
            self.stdout.write(out.getvalue())
        except ImportError:
            pass
        self.stdout.write(self.style.SUCCESS(f'TOTP enrolled for {username}. Scan the code, then log in to the admin.'))
