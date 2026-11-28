"""The blog (blog.py): the Markdown subset renders safely; drafts and
scheduled articles stay hidden from the API, the crawler pages, the sitemap
and the feed; crawler pages carry the article and its tags; staff write,
schedule and publish in the backoffice, and only the owner deletes."""
import json
import re
from datetime import timedelta

from django.contrib.auth.models import Group, User
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.invitations import blog
from apps.invitations.models import Article, ArticleImage

from .base import APITestBase, png_upload

PASSWORD = 'x-Strong-pass-91'


class RenderTests(APITestBase):
    def test_blocks(self):
        html = blog.render('## Persiapan Akad\n\nParagraf satu\nbaris dua\n\n- satu\n- dua\n\n1. pertama\n2. kedua\n\n'
                           '> kutipan bijak\n\n---\n\n### Sub bagian')
        self.assertIn('<h2 id="persiapan-akad">Persiapan Akad</h2>', html)
        self.assertIn('<p>Paragraf satu<br>baris dua</p>', html)
        self.assertIn('<ul><li>satu</li><li>dua</li></ul>', html)
        self.assertIn('<ol><li>pertama</li><li>kedua</li></ol>', html)
        self.assertIn('<blockquote><p>kutipan bijak</p></blockquote>', html)
        self.assertIn('<hr>', html)
        self.assertIn('<h3 id="sub-bagian">Sub bagian</h3>', html)

    def test_inline(self):
        html = blog.render('Ini **penting** dan *miring*, lihat [tema](/tema/sage) atau [luar](https://contoh.id/a_b_c).')
        self.assertIn('<strong>penting</strong>', html)
        self.assertIn('<em>miring</em>', html)
        self.assertIn('<a href="/tema/sage">tema</a>', html)
        self.assertIn('<a href="https://contoh.id/a_b_c" rel="noopener" target="_blank">luar</a>', html)

    def test_images_with_captions(self):
        html = blog.render('![Pelaminan Minang](https://media.contoh.id/blog/a.jpg "Pelaminan di Bukittinggi")')
        self.assertEqual(html, '<figure><img src="https://media.contoh.id/blog/a.jpg" alt="Pelaminan Minang" '
                               'loading="lazy"><figcaption>Pelaminan di Bukittinggi</figcaption></figure>')

    def test_nothing_unsafe_gets_through(self):
        html = blog.render('<script>alert(1)</script> [klik](javascript:alert(1)) [x](//evil.com)\n\n'
                           '![a](javascript:alert(1))\n\n<img src=x onerror=alert(1)>\n\n[q](https://x.id/"onmouseover="a)')
        self.assertNotIn('<script', html)
        self.assertNotIn('<img src=x', html)
        self.assertNotIn('href="javascript', html)
        self.assertNotIn('href="//evil', html)
        self.assertNotIn('src="javascript', html)
        self.assertNotIn('"onmouseover', html)
        self.assertIn('&lt;script&gt;', html)

    def test_reading_time_description_and_sections(self):
        body = '## Satu\n\n' + ' '.join(['kata'] * 450) + '\n\n### Dua'
        self.assertEqual(blog.reading_minutes(body), 2)
        self.assertEqual(blog.headings(body), [{'id': 'satu', 'text': 'Satu', 'level': 2},
                                               {'id': 'dua', 'text': 'Dua', 'level': 3}])
        article = Article(title='x', body='**Tebal** dan [tautan](/a). ' * 30)
        self.assertTrue(blog.description(article).startswith('Tebal dan tautan.'))
        self.assertLessEqual(len(blog.description(article)), 160)


class PublicBlogTests(APITestBase):
    def setUp(self):
        super().setUp()
        now = timezone.now()
        self.live = Article.objects.create(title='Tips Memilih Tema Undangan', slug='tips-memilih-tema',
                                           category='persiapan', excerpt='Cara memilih tema yang pas.',
                                           body='## Mulai dari adat\n\nIsi artikel.', status='published',
                                           published_at=now - timedelta(days=1), theme='sage')
        Article.objects.create(title='Draf Rahasia', slug='draf-rahasia', body='rahasia', status='draft')
        Article.objects.create(title='Terjadwal Rahasia', slug='terjadwal-rahasia', body='rahasia', status='published',
                               published_at=now + timedelta(days=2))

    def test_api_lists_live_articles_only(self):
        res = self.client.get('/api/blog/')
        self.assertEqual([a['slug'] for a in res.data['results']], ['tips-memilih-tema'])
        self.assertEqual({c['key']: c['count'] for c in res.data['categories']}['persiapan'], 1)
        self.assertEqual(self.client.get('/api/blog/', {'kategori': 'adat'}).data['count'], 0)
        for slug in ('draf-rahasia', 'terjadwal-rahasia', 'tidak-ada'):
            self.assertEqual(self.client.get(f'/api/blog/{slug}/').status_code, 404)

    def test_api_article(self):
        res = self.client.get('/api/blog/tips-memilih-tema/')
        self.assertIn('<h2 id="mulai-dari-adat">', res.data['html'])
        self.assertEqual(res.data['theme']['id'], 'sage')
        self.assertEqual(res.data['toc'][0]['text'], 'Mulai dari adat')

    @override_settings(FRONTEND_URL='https://vowvella.id')
    def test_crawler_page_carries_the_article_and_its_tags(self):
        res = self.client.get('/blog/tips-memilih-tema', HTTP_USER_AGENT='Googlebot')
        html = res.content.decode()
        self.assertEqual(res.status_code, 200)
        self.assertIn('<title>Tips Memilih Tema Undangan · Vowvella</title>', html)
        self.assertIn('<link rel="canonical" href="https://vowvella.id/blog/tips-memilih-tema" />', html)
        self.assertIn('<meta name="description" content="Cara memilih tema yang pas." />', html)
        self.assertIn('<h2 id="mulai-dari-adat">Mulai dari adat</h2>', html)
        ld = json.loads(re.search(r'<script type="application/ld\+json">(.+?)</script>', html).group(1))
        self.assertEqual((ld['@type'], ld['headline']), ('BlogPosting', 'Tips Memilih Tema Undangan'))
        self.assertEqual(res['Content-Security-Policy'].split(';')[0], "default-src 'none'")
        self.assertEqual(self.client.get('/blog/draf-rahasia/').status_code, 404)
        self.assertEqual(self.client.get('/blog/terjadwal-rahasia').status_code, 404)

    def test_index_page_sitemap_and_feed_list_live_articles_only(self):
        for url in ('/blog', '/blog/', '/sitemap-blog.xml', '/blog/rss.xml'):
            with self.subTest(url=url):
                body = self.client.get(url).content.decode()
                self.assertIn('tips-memilih-tema', body)
                self.assertNotIn('rahasia', body)

    def test_title_in_json_ld_cannot_close_the_script(self):
        Article.objects.filter(pk=self.live.pk).update(title='Akhir</script><script>alert(1)</script>')
        html = self.client.get('/blog/tips-memilih-tema').content.decode()
        self.assertEqual(html.count('</script>'), 1)

    def test_blog_is_not_an_invitation_slug(self):
        from apps.invitations.share_views import is_reserved_slug
        self.assertTrue(is_reserved_slug('blog'))


class StaffBlogTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user('pemilik', password=PASSWORD, is_staff=True, is_superuser=True)
        self.helper = User.objects.create_user('bantu', password=PASSWORD, is_staff=True)
        self.helper.groups.add(Group.objects.get(name='Staf'))

    def login(self, user):
        self.client = APIClient()
        with override_settings(ADMIN_REQUIRE_OTP=False):
            self.client.post('/api/staff/login/', {'username': user.username, 'password': PASSWORD}, format='json')

    def test_staff_write_schedule_and_publish(self):
        self.login(self.helper)
        res = self.client.post('/api/staff/articles/', {'title': 'Adat Mappacci di Bugis', 'category': 'adat'},
                               format='json')
        self.assertEqual((res.status_code, res.data['slug'], res.data['state']), (201, 'adat-mappacci-di-bugis', 'draft'))
        pk = res.data['id']
        res = self.client.patch(f'/api/staff/articles/{pk}/', {'status': 'published'}, format='json')
        self.assertEqual(res.data, {'body': 'Isi artikel masih kosong.'})
        later = (timezone.localtime() + timedelta(days=3)).strftime('%Y-%m-%dT%H:%M')
        res = self.client.patch(f'/api/staff/articles/{pk}/', {'body': '## Makna\n\nIsi.', 'status': 'published',
                                                               'published_at': later}, format='json')
        self.assertEqual(res.data['state'], 'scheduled')
        self.assertEqual(self.client.get('/api/blog/adat-mappacci-di-bugis/').status_code, 404)
        res = self.client.patch(f'/api/staff/articles/{pk}/', {'published_at': ''}, format='json')
        self.assertEqual(res.data['state'], 'live')
        self.assertEqual(self.client.get('/api/blog/adat-mappacci-di-bugis/').status_code, 200)
        res = self.client.patch(f'/api/staff/articles/{pk}/', {'slug': 'alamat-baru'}, format='json')
        self.assertIn('slug', res.data)   # a live article keeps its address
        self.assertEqual(self.client.delete(f'/api/staff/articles/{pk}/').status_code, 403)
        self.login(self.owner)
        self.assertEqual(self.client.delete(f'/api/staff/articles/{pk}/').status_code, 204)

    def test_slugs_stay_unique(self):
        self.login(self.owner)
        a = self.client.post('/api/staff/articles/', {'title': 'Tips Hemat'}, format='json').data
        b = self.client.post('/api/staff/articles/', {'title': 'Tips Hemat'}, format='json').data
        self.assertEqual((a['slug'], b['slug']), ('tips-hemat', 'tips-hemat-2'))
        res = self.client.patch(f"/api/staff/articles/{b['id']}/", {'slug': 'tips-hemat'}, format='json')
        self.assertIn('slug', res.data)

    def test_cover_inline_images_and_preview(self):
        self.login(self.helper)
        pk = self.client.post('/api/staff/articles/', {'title': 'Galeri'}, format='json').data['id']
        res = self.client.post(f'/api/staff/articles/{pk}/cover/', {'image': png_upload()}, format='multipart')
        self.assertTrue(res.data['cover'].startswith('http'))
        from django.core.files.uploadedfile import SimpleUploadedFile
        bad = SimpleUploadedFile('x.png', b'not an image', content_type='image/png')
        self.assertEqual(self.client.post(f'/api/staff/articles/{pk}/cover/', {'image': bad}, format='multipart').status_code, 400)
        res = self.client.post('/api/staff/articles/images/', {'image': png_upload(), 'article': pk, 'alt': 'Pelaminan'},
                               format='multipart')
        self.assertTrue(res.data['markdown'].startswith('![Pelaminan](http'))
        self.assertEqual(ArticleImage.objects.get().article_id, pk)
        res = self.client.post('/api/staff/articles/preview/', {'body': '## Hai\n\n' + res.data['markdown']}, format='json')
        self.assertIn('<figure><img src="http', res.data['html'])
        self.assertEqual(res.data['toc'][0]['id'], 'hai')

    def test_couples_and_anonymous_get_nothing(self):
        couple = APIClient()
        couple.force_authenticate(User.objects.create_user('pasangan', password=PASSWORD))
        for client in (APIClient(), couple):
            self.assertIn(client.get('/api/staff/articles/').status_code, (401, 403))
            self.assertIn(client.post('/api/staff/articles/', {'title': 'x'}, format='json').status_code, (401, 403))
