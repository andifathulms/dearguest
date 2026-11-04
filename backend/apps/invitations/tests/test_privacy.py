"""Data protection (UU PDP): retention purge with notice, files leaving storage
with their rows, export of everything, account deletion, PII scrubbing."""
import io
import zipfile
from datetime import date, datetime, timedelta, timezone as dt_timezone
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.utils import timezone

from apps.invitations import pii, retention
from apps.invitations.models import RSVP, BankAccount, Event, Guest, Invitation, Photo, ProcessedImage

from .base import APITestBase, mp3_upload, png_bytes

PASSWORD = 'x-Strong-pass-91'


def big_png(name='foto.png'):
    from PIL import Image
    buf = io.BytesIO()
    Image.new('RGB', (1200, 800), (200, 120, 90)).save(buf, 'PNG')
    return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')


class PrivacyBase(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user('andini', email='andini@example.com', password=PASSWORD)
        self.inv = self.make_invitation(owner=self.owner, slug='andini-bagus')
        self.guest = Guest.objects.create(invitation=self.inv, name='Budi Santoso', whatsapp='6281234567890', open_count=2)
        RSVP.objects.create(invitation=self.inv, guest_name='Budi Santoso', whatsapp='081234567890', attending=True,
                            wishes='Selamat!')
        Event.objects.create(invitation=self.inv, event_type='akad', venue_name='Masjid', address='Jl. Mawar 1',
                             start=datetime(2026, 12, 12, 1, tzinfo=dt_timezone.utc), is_primary=True)
        self.photo = Photo.objects.create(invitation=self.inv, image=big_png())
        BankAccount.objects.create(invitation=self.inv, account_type='qris', bank_name='QRIS', account_name='A',
                                   qris_image=big_png('qris.png'))
        self.inv.music_file = mp3_upload()
        self.inv.hero_photo = big_png('hero.png')
        self.inv.gift_address = 'Jl. Melati 3'
        self.inv.gift_phone = '0812-1111-2222'
        self.inv.save()

    def stored(self):
        """Every stored file name of the invitation, renditions included."""
        names = [self.inv.music_file.name, self.inv.hero_photo.name, self.photo.image.name]
        names += BankAccount.objects.filter(invitation=self.inv).values_list('qris_image', flat=True)
        for p in ProcessedImage.objects.filter(name__in=names):
            names += list(p.variants.values())
        return [n for n in names if n]

    def expire(self, days_ago):
        Invitation.objects.filter(pk=self.inv.pk).update(expires_at=timezone.localdate() - timedelta(days=days_ago))
        self.inv.refresh_from_db()


class RetentionTests(PrivacyBase):
    def test_nothing_happens_before_the_notice_window(self):
        self.expire(settings.RETENTION_DAYS - settings.RETENTION_NOTICE_DAYS - 1)
        call_command('purge_expired', stdout=io.StringIO())
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(Guest.objects.count(), 1)

    def test_notice_a_week_ahead_then_purge_of_rows_and_files(self):
        self.expire(settings.RETENTION_DAYS - settings.RETENTION_NOTICE_DAYS)
        files = self.stored()
        self.assertGreaterEqual(len(files), 6)   # originals + WebP renditions
        out = io.StringIO()
        call_command('purge_expired', stdout=out)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('/dashboard/andini-bagus', mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ['andini@example.com'])
        self.assertNotIn('Budi', out.getvalue())

        # Deletion day, but the notice isn't a week old yet: wait.
        self.expire(settings.RETENTION_DAYS)
        call_command('purge_expired', stdout=io.StringIO())
        self.assertEqual(Guest.objects.count(), 1)

        Invitation.objects.filter(pk=self.inv.pk).update(purge_notice_sent_at=timezone.now() - timedelta(days=8))
        out = io.StringIO()
        with self.captureOnCommitCallbacks(execute=True):   # files go once the purge commits
            call_command('purge_expired', stdout=out)
        self.assertIn('invitations_purged=1', out.getvalue())
        self.assertNotIn('Budi', out.getvalue())
        self.inv.refresh_from_db()
        self.assertIsNotNone(self.inv.purged_at)
        for model in (Guest, RSVP, Photo, BankAccount):
            self.assertFalse(model.objects.filter(invitation=self.inv).exists(), model)
        self.assertEqual((self.inv.gift_address, self.inv.gift_phone), ('', ''))
        self.assertFalse(self.inv.music_file or self.inv.hero_photo)
        storage = self.photo.image.storage
        self.assertEqual([n for n in files if storage.exists(n)], [])
        self.assertEqual(Event.objects.filter(invitation=self.inv).count(), 1)   # the invitation shell stays

    def test_dry_run_changes_nothing(self):
        self.expire(settings.RETENTION_DAYS + 30)
        out = io.StringIO()
        call_command('purge_expired', '--dry-run', stdout=out)
        self.assertIn('invitations_due=0', out.getvalue())   # notice not sent yet
        self.assertEqual((len(mail.outbox), Guest.objects.count()), (0, 1))

    def test_couple_without_email_is_purged_on_schedule(self):
        User.objects.filter(pk=self.owner.pk).update(email='')
        self.expire(settings.RETENTION_DAYS)
        call_command('purge_expired', stdout=io.StringIO())
        self.assertFalse(Guest.objects.filter(invitation=self.inv).exists())

    def test_link_previews_are_removed(self):
        og = Path(settings.MEDIA_ROOT) / 'og' / self.inv.slug
        og.mkdir(parents=True, exist_ok=True)
        (og / 'abc.jpg').write_bytes(b'x')
        retention.purge(self.inv)
        self.assertFalse(og.exists())


class FileCleanupTests(PrivacyBase):
    def test_replacing_a_photo_removes_the_old_file_and_renditions(self):
        old = [self.photo.image.name, *ProcessedImage.objects.get(name=self.photo.image.name).variants.values()]
        self.login(self.owner)
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.patch(f'/api/my/invitations/{self.inv.slug}/photos/{self.photo.pk}/',
                                    {'image': big_png('baru.png')}, format='multipart')
        self.assertEqual(res.status_code, 200, res.data)
        storage = self.photo.image.storage
        self.assertEqual([n for n in old if storage.exists(n)], [])
        self.assertFalse(ProcessedImage.objects.filter(name=old[0]).exists())

    def test_deleting_a_row_removes_its_file(self):
        name = self.photo.image.name
        with self.captureOnCommitCallbacks(execute=True):
            self.photo.delete()
        self.assertFalse(self.photo.image.storage.exists(name))


class ExportAndDeleteTests(PrivacyBase):
    def reauth(self, password=PASSWORD):
        return self.client.post('/api/auth/reauth/', {'password': password}, format='json')

    def test_export_needs_a_fresh_password(self):
        self.login(self.owner)
        url = f'/api/my/invitations/{self.inv.slug}/export.zip'
        self.assertEqual(self.client.get(url).status_code, 403)
        self.assertEqual(self.reauth('salah').status_code, 403)
        self.assertEqual(self.reauth().status_code, 204)
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        z = zipfile.ZipFile(io.BytesIO(b''.join(res.streaming_content)))
        names = z.namelist()
        for expected in ('invitation.json', 'guests.csv', 'rsvps.csv', 'wishes.csv', 'events.csv'):
            self.assertIn(expected, names)
        self.assertIn('6281234567890', z.read('guests.csv').decode())
        self.assertIn('081234567890', z.read('rsvps.csv').decode())
        self.assertIn('Selamat!', z.read('wishes.csv').decode())
        self.assertTrue(any(n.startswith('galeri/') for n in names))
        self.assertTrue(any(n.startswith('music/') for n in names))

    def test_delete_account_removes_everything(self):
        self.login(self.owner)
        files = self.stored()
        self.assertEqual(self.client.post('/api/auth/delete-account/').status_code, 403)
        self.reauth()
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post('/api/auth/delete-account/')
        self.assertEqual(res.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.owner.pk).exists())
        self.assertFalse(Invitation.objects.filter(slug='andini-bagus').exists())
        self.assertFalse(Guest.objects.exists() or RSVP.objects.exists())
        storage = self.photo.image.storage
        self.assertEqual([n for n in files if storage.exists(n)], [])


class ScrubberTests(APITestBase):
    def test_text_patterns(self):
        text = ('Gagal kirim ke Budi 0812-3456-7890 / +62 812 3456 7891, andini@example.com, '
                'link https://dearguest.id/andini-bagus/K7MPQ2?to=Budi%20Santoso '
                'token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoxfQ.abc123')
        out = pii.scrub_text(text)
        for secret in ('3456-7890', '812 3456 7891', 'andini@example.com', 'K7MPQ2', 'Budi%20Santoso', 'eyJhbGci'):
            self.assertNotIn(secret, out)
        self.assertIn('/andini-bagus/[kode]', out)
        self.assertEqual(pii.scrub_text('/api/invitations/andini-bagus/rsvps/'), '/api/invitations/andini-bagus/rsvps/')
        self.assertEqual(pii.scrub_text('/tema/javanese'), '/tema/javanese')

    def test_sensitive_keys_are_masked_whatever_they_hold(self):
        out = pii.scrub({'guest_name': 'Budi', 'whatsapp': '0812', 'nested': [{'address': 'Jl. Mawar'}],
                         'request_id': 'abc', 'count': 3})
        self.assertEqual(out, {'guest_name': pii.MASK, 'whatsapp': pii.MASK, 'nested': [{'address': pii.MASK}],
                               'request_id': 'abc', 'count': 3})

    def test_timestamps_and_ids_survive(self):
        crumb = {'timestamp': '2026-10-29T10:51:53.502927Z', 'category': 'query', 'message': 'SELECT 1', 'request_id': 'abc'}
        self.assertEqual(pii.scrub_breadcrumb(dict(crumb)), crumb)
