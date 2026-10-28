"""Link previews: crawler tag pages, content-hashed preview images, and the
rule that a personal preview comes only from the guest list, never from ?to=."""
import io
from datetime import datetime, timezone
from urllib.parse import quote

from PIL import Image

from apps.invitations import og
from apps.invitations.models import Event, Guest

from .base import APITestBase

WHATSAPP = 'WhatsApp/2.23.20.0 A'
OFFENSIVE = '<b>KATA KASAR</b> "onclick=alert(1)'
LONG_TO = 'Z' * 10_000


class OgBase(APITestBase):
    def setUp(self):
        super().setUp()
        self.inv = self.make_invitation(slug='live', active=True, copy_variant='islam')
        self.event = Event.objects.create(
            invitation=self.inv, event_type='akad', venue_name='Masjid', address='Jl. Mawar',
            start=datetime(2026, 12, 12, 1, 0, tzinfo=timezone.utc), timezone='Asia/Jakarta', is_primary=True,
        )
        self.guest = Guest.objects.create(invitation=self.inv, name='Bapak Ahmad Fauzi', code='K7MPQ2')
        self.draft = self.make_invitation(slug='draft', active=False)

    def crawl(self, path):
        return self.client.get(path, HTTP_USER_AGENT=WHATSAPP)

    def image_path(self, res):
        body = res.content.decode()
        start = body.index('property="og:image" content="') + len('property="og:image" content="')
        url = body[start:body.index('"', start)]
        return url[url.index('/og/'):]

    def digest(self, guest=None):
        self.inv.refresh_from_db()
        return og.preview_hash(og.preview_data(self.inv, guest))


class CrawlerPageTests(OgBase):
    def test_invitation_link_has_indonesian_tags_and_a_sized_image(self):
        res = self.crawl('/live')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Undangan Pernikahan Andini &amp; Bagus')
        self.assertContains(res, 'Assalamualaikum')
        self.assertContains(res, 'Sabtu, 12 Desember 2026')
        self.assertContains(res, 'og:image:width" content="1200"')
        self.assertContains(res, 'og:image:height" content="630"')
        self.assertContains(res, 'twitter:card" content="summary_large_image"')
        self.assertContains(res, 'og:url" content="http://localhost:5173/live"')
        self.assertContains(res, 'name="robots" content="noindex, nofollow"')
        self.assertEqual(res['X-Robots-Tag'], 'noindex, nofollow')
        self.assertNotContains(res, 'Jl. Mawar')   # no address in the preview

    def test_guest_link_is_personal_with_the_name_from_the_list(self):
        for path in ('/live/K7MPQ2', '/live/k7mpq2/', '/share/live/?g=K7MPQ2'):
            with self.subTest(path=path):
                res = self.crawl(path)
                self.assertContains(res, 'Untuk Bapak Ahmad Fauzi')
                self.assertContains(res, 'og:url" content="http://localhost:5173/live/K7MPQ2"')
                self.assertIn('/og/live/K7MPQ2/', self.image_path(res))

    def test_unknown_code_gets_the_plain_preview(self):
        res = self.crawl('/live/ZZZZZZ')
        self.assertEqual(res.status_code, 200)
        self.assertNotContains(res, 'Untuk')
        self.assertContains(res, 'og:url" content="http://localhost:5173/live"')

    def test_to_parameter_never_reaches_tags_or_image(self):
        plain = self.image_path(self.crawl('/live'))
        guest = self.image_path(self.crawl('/live/K7MPQ2'))
        for to in (OFFENSIVE, LONG_TO):
            q = quote(to)
            for path, image in ((f'/live?to={q}', plain), (f'/live/K7MPQ2?to={q}', guest),
                                (f'/share/live/?to={q}', plain), (f'/share/live/?to={q}&g=K7MPQ2', guest)):
                with self.subTest(path=path[:40]):
                    res = self.crawl(path)
                    # /share/ hands ?to= on to the SPA in its redirect, for the
                    # cover; the tags before it must not contain it.
                    tags = res.content.decode().split('<meta http-equiv')[0]
                    self.assertNotIn('KATA KASAR', tags)
                    self.assertNotIn('ZZZZZZZZZZ', tags)
                    self.assertEqual(self.image_path(res), image)

    def test_hidden_or_missing_invitations_get_the_generic_page(self):
        for path in ('/draft', '/draft/K7MPQ2', '/nope'):
            with self.subTest(path=path):
                res = self.crawl(path)
                self.assertEqual(res.status_code, 404)
                self.assertContains(res, 'DearGuest', status_code=404)
                self.assertNotContains(res, 'Andini', status_code=404)
                self.assertNotContains(res, 'og:image', status_code=404)

    def test_site_paths_get_site_tags_and_admin_keeps_its_slash_redirect(self):
        res = self.crawl('/tema')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'DearGuest')
        self.assertEqual(self.client.get('/admin').status_code, 301)

    def test_legacy_share_link_sends_people_to_the_clean_link(self):
        res = self.client.get('/share/live/?to=Budi&g=K7MPQ2')
        self.assertContains(res, 'window.location.replace("http://localhost:5173/live/K7MPQ2")')
        res = self.client.get('/share/live/?to=Budi')
        self.assertContains(res, 'window.location.replace("http://localhost:5173/live?to=Budi")')


class PreviewImageTests(OgBase):
    def test_image_is_a_cached_jpeg_within_limits(self):
        res = self.client.get(self.image_path(self.crawl('/live/K7MPQ2')))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'image/jpeg')
        self.assertEqual(res['Cache-Control'], 'public, max-age=31536000, immutable')
        data = b''.join(res.streaming_content)
        self.assertLessEqual(len(data), og.MAX_BYTES)
        self.assertEqual(Image.open(io.BytesIO(data)).size, og.SIZE)

    def test_outdated_hash_redirects_to_the_current_image(self):
        res = self.client.get('/og/live/0123456789abcdef.jpg')
        self.assertEqual(res.status_code, 302)
        self.assertEqual(res['Location'], f'/og/live/{self.digest()}.jpg')

    def test_no_image_for_drafts_or_unknown_guests(self):
        self.assertEqual(self.client.get('/og/draft/0123456789abcdef.jpg').status_code, 404)
        self.assertEqual(self.client.get(f'/og/live/ZZZZZZ/{self.digest()}.jpg').status_code, 404)

    def test_hash_follows_what_is_drawn(self):
        base = self.digest()
        self.assertEqual(self.digest(), base)
        self.assertNotEqual(self.digest(self.guest), base)

        couple = self.inv.couple
        couple.bride_name = 'Andini Putri'
        couple.save()
        renamed = self.digest()
        self.assertNotEqual(renamed, base)

        self.event.start = datetime(2026, 12, 13, 1, 0, tzinfo=timezone.utc)
        self.event.save()
        moved = self.digest()
        self.assertNotEqual(moved, renamed)

        self.event.timezone = 'Asia/Makassar'
        self.event.save()
        rezoned = self.digest()
        self.assertNotEqual(rezoned, moved)

        self.inv.theme = 'floral'
        self.inv.save()
        rethemed = self.digest()
        self.assertNotEqual(rethemed, rezoned)

        self.inv.copy_variant = 'kristen'
        self.inv.save()
        kristen = self.digest()
        self.assertNotEqual(kristen, rethemed)

        self.inv.opening_text = 'Teks pembuka baru'   # not drawn: same image
        self.inv.save()
        self.assertEqual(self.digest(), kristen)


class RenderTests(OgBase):
    NAMES = [
        ('Andini', 'Bagus'),
        ('Raden Ajeng Siti Nurhaliza Kusumawardhani', "Muhammad Fadhil Al-Ma'ruf Prasetyo"),
        ("Ni Luh Ayu Kade Dewi Saraswati", "I Gusti Ngurah Bagus Wiryawan"),
        ('Céline Anaïs', "Ma'ruf Ğazali"),
        ('A' * 200, 'B' * 200),
        ('Andini', ''),
    ]

    def test_every_pack_renders_every_name_pair_within_limits(self):
        for pack in ('floral', 'javanese', 'sage', 'bugis', 'minang', 'sunda', 'not-a-pack'):
            for bride, groom in self.NAMES:
                with self.subTest(pack=pack, bride=bride[:20]):
                    data = {**og.preview_data(self.inv, self.guest), 'pack': pack, 'bride': bride, 'groom': groom}
                    jpg = og.render(data)
                    self.assertLessEqual(len(jpg), og.MAX_BYTES)
                    self.assertEqual(Image.open(io.BytesIO(jpg)).size, og.SIZE)

    def test_date_is_shown_in_the_event_zone(self):
        # 16:30 UTC on the 12th is already the 13th in Jayapura (WIT, UTC+9).
        self.event.start = datetime(2026, 12, 12, 16, 30, tzinfo=timezone.utc)
        self.event.timezone = 'Asia/Jayapura'
        self.event.save()
        data = og.preview_data(self.inv)
        self.assertEqual(data['date'], 'Minggu, 13 Desember 2026')
        self.assertEqual(data['event'], 'Akad Nikah · 01.30 WIT')
