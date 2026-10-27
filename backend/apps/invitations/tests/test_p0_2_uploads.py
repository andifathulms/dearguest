"""p0-2: user uploads are validated by content, size-capped, and stored under
an extension derived from that content."""
import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings

from apps.invitations.models import Invitation, Photo
from apps.invitations.uploads import sniff, AUDIO_MAX_BYTES

from .base import APITestBase, MP3_BYTES, mp3_upload, png_bytes, png_upload

HTML = b'<!doctype html><script>alert(localStorage.access_token)</script>'
SVG = b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'
GIF = b'GIF89a\x01\x00\x01\x00\x00\x00\x00;'


def upload(name, data, ctype):
    return SimpleUploadedFile(name, data, content_type=ctype)


class SniffTests(APITestBase):
    def test_known_signatures(self):
        self.assertEqual(sniff(png_bytes()[:16]), 'image/png')
        self.assertEqual(sniff(b'\xff\xd8\xff\xe0' + b'\x00' * 12), 'image/jpeg')
        self.assertEqual(sniff(b'RIFF\x00\x00\x00\x00WEBPVP8 '), 'image/webp')
        self.assertEqual(sniff(MP3_BYTES[:16]), 'audio/mpeg')
        self.assertEqual(sniff(b'ID3\x04' + b'\x00' * 12), 'audio/mpeg')
        self.assertEqual(sniff(b'OggS' + b'\x00' * 12), 'audio/ogg')
        self.assertEqual(sniff(b'\x00\x00\x00\x20ftypM4A \x00\x00'), 'audio/mp4')
        self.assertEqual(sniff(b'\xff\xf1\x50\x80' + b'\x00' * 12), 'audio/aac')
        for bad in (HTML, SVG, GIF, b'', b'%PDF-1.7'):
            self.assertIsNone(sniff(bad[:16]))


class MusicUploadTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, active=False)
        self.url = f'/api/my/invitations/{self.inv.slug}/'
        self.login(self.owner)

    def patch(self, **files):
        return self.client.patch(self.url, files, format='multipart')

    def test_html_renamed_mp3_is_rejected(self):
        res = self.patch(music_file=upload('song.mp3', HTML, 'audio/mpeg'))
        self.assertEqual(res.status_code, 400)
        self.assertIn('music_file', res.data)
        self.assertFalse(Invitation.objects.get(pk=self.inv.pk).music_file)

    def test_image_in_music_field_is_rejected(self):
        res = self.patch(music_file=upload('song.mp3', png_bytes(), 'audio/mpeg'))
        self.assertEqual(res.status_code, 400)

    def test_valid_mp3_is_accepted(self):
        res = self.patch(music_file=mp3_upload())
        self.assertEqual(res.status_code, 200)
        name = Invitation.objects.get(pk=self.inv.pk).music_file.name
        self.assertTrue(name.startswith('music/') and name.endswith('.mp3'), name)

    def test_oversize_audio_is_rejected(self):
        big = MP3_BYTES + b'\x00' * (AUDIO_MAX_BYTES + 1 - len(MP3_BYTES))
        res = self.patch(music_file=upload('long.mp3', big, 'audio/mpeg'))
        self.assertEqual(res.status_code, 400)

    def test_stored_extension_comes_from_content_not_filename(self):
        res = self.patch(music_file=upload('evil.html', MP3_BYTES, 'text/html'))
        self.assertEqual(res.status_code, 200)
        self.assertTrue(Invitation.objects.get(pk=self.inv.pk).music_file.name.endswith('.mp3'))

    def test_hero_photo_rejects_html(self):
        res = self.patch(hero_photo=upload('hero.jpg', HTML, 'image/jpeg'))
        self.assertEqual(res.status_code, 400)


class ImageUploadTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, active=False)
        self.login(self.owner)

    def post_photo(self, f):
        return self.client.post(f'/api/my/invitations/{self.inv.slug}/photos/', {'image': f}, format='multipart')

    def test_svg_gif_and_html_photos_are_rejected(self):
        for name, data, ctype in [('a.svg', SVG, 'image/svg+xml'), ('a.gif', GIF, 'image/gif'), ('a.jpg', HTML, 'image/jpeg')]:
            with self.subTest(name=name):
                self.assertEqual(self.post_photo(upload(name, data, ctype)).status_code, 400)
        self.assertEqual(Photo.objects.count(), 0)

    def test_png_named_jpg_is_stored_as_png(self):
        res = self.post_photo(upload('x.jpg', png_bytes(), 'image/jpeg'))
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Photo.objects.get().image.name.endswith('.png'))

    def test_qris_and_couple_photo_reject_html(self):
        res = self.client.post(
            f'/api/my/invitations/{self.inv.slug}/bank-accounts/',
            {'account_type': 'qris', 'bank_name': 'QRIS', 'account_name': 'A', 'qris_image': upload('q.png', HTML, 'image/png')},
            format='multipart',
        )
        self.assertEqual(res.status_code, 400)
        res = self.client.put(
            f'/api/my/invitations/{self.inv.slug}/couple/',
            {'bride_photo': upload('b.jpg', HTML, 'image/jpeg')}, format='multipart',
        )
        self.assertEqual(res.status_code, 400)


class MediaOriginTests(APITestBase):
    @override_settings(MEDIA_URL='https://media.example.com/media/')
    def test_api_media_urls_use_the_media_origin(self):
        inv = self.make_invitation(active=True)
        inv.hero_photo = png_upload()
        inv.save()
        res = self.client.get(f'/api/invitations/{inv.slug}/')
        self.assertTrue(res.data['hero_photo'].startswith('https://media.example.com/media/hero/'), res.data['hero_photo'])


class AuditUploadsCommandTests(APITestBase):
    def test_reports_disallowed_files_and_deletes_nothing(self):
        inv = self.make_invitation(active=True)
        # Write a bad file straight to storage, bypassing validation (simulates legacy rows).
        name = inv.music_file.storage.save('music/legacy.mp3', io.BytesIO(HTML))
        Invitation.objects.filter(pk=inv.pk).update(music_file=name)
        Photo.objects.create(invitation=inv, image=png_upload())
        out = io.StringIO()
        call_command('audit_uploads', stdout=out)
        report = out.getvalue()
        self.assertIn('music/legacy.mp3', report)
        self.assertIn('Disallowed content: 1', report)
        self.assertNotIn('Photo#', report)
        self.assertTrue(inv.music_file.storage.exists(name))
