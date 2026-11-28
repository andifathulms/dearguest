"""The blog (/blog): articles written in the backoffice, read in the SPA, and
served as plain HTML to search engines and link previews (nginx sends known
crawlers here, like invitation links), with a sitemap and an RSS feed.

Bodies are a small Markdown subset, rendered here and only here, so people
and crawlers see the same text. Everything is escaped first; only the markup
below comes out:

    ## Judul bagian / ### Sub-judul        > kutipan
    **tebal**, *miring*, [tautan](https://…) - daftar / 1. daftar bernomor
    ![teks alt](https://…/gambar.jpg "keterangan")   (an image on its own line)
    ---                                               (a divider)
A single line break inside a paragraph is kept."""
import json
import re
from html import escape

from django.conf import settings
from django.http import Http404, HttpResponse
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.http import require_GET
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import themes
from .models import Article

WORDS_PER_MINUTE = 200
SITE_NAME = 'Vowvella'
CATEGORY_LABELS = dict(Article.CATEGORIES)


# ---- what is live ----

def live(now=None):
    return Article.objects.filter(status='published', published_at__lte=now or timezone.now())


def is_live(article, now=None):
    return article.status == 'published' and article.published_at is not None \
        and article.published_at <= (now or timezone.now())


def unique_slug(title, exclude_pk=None):
    base = slugify(title)[:110].strip('-') or 'artikel'
    slug, n = base, 2
    while Article.objects.filter(slug=slug).exclude(pk=exclude_pk).exists():
        slug, n = f'{base}-{n}', n + 1
    return slug


# ---- Markdown subset ----

_SAFE_URL = re.compile(r'^(https?://|/(?!/)|#|mailto:)', re.I)
_IMAGE_LINE = re.compile(r'^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$')
_HEADING = re.compile(r'^(#{1,3})\s+(.+)$')
_UL = re.compile(r'^[-*]\s+(.+)$')
_OL = re.compile(r'^\d+[.)]\s+(.+)$')


def _url(raw):
    """A link or image address if it's one we allow, else None. `raw` is
    already HTML-escaped."""
    url = raw.strip()
    return url if _SAFE_URL.match(url) else None


def _emphasis(text):
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])', r'<em>\1</em>', text)
    return re.sub(r'(?<![_\w])_(?!\s)(.+?)(?<!\s)_(?![_\w])', r'<em>\1</em>', text)


def _inline(text):
    """Escape, then links, bold and italic. Links are set aside while emphasis
    is applied, so an underscore or asterisk in an address stays put."""
    out = escape(text.replace('\x00', ''), quote=True)
    links = []

    def link(m):
        url = _url(m.group(2))
        if not url:
            return m.group(1)
        external = url.lower().startswith(('http://', 'https://')) and not _is_own(url)
        rel = ' rel="noopener" target="_blank"' if external else ''
        links.append(f'<a href="{url}"{rel}>{_emphasis(m.group(1))}</a>')
        return f'\x00{len(links) - 1}\x00'

    out = _emphasis(re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', link, out))
    return re.sub(r'\x00(\d+)\x00', lambda m: links[int(m.group(1))], out)


def _is_own(url):
    origin = settings.FRONTEND_URL.rstrip('/')
    return bool(origin) and url.startswith(origin)


def heading_id(text):
    return slugify(text)[:60] or 'bagian'


def render(markdown):
    """HTML for an article body. Unknown or unsafe markup comes out as text."""
    lines = (markdown or '').replace('\r\n', '\n').replace('\r', '\n').split('\n')
    html, para, items, kind, quote = [], [], [], None, []

    def flush_para():
        if para:
            html.append('<p>' + '<br>'.join(_inline(line) for line in para) + '</p>')
            para.clear()

    def flush_list():
        nonlocal kind
        if items:
            tag = 'ol' if kind == 'ol' else 'ul'
            html.append(f'<{tag}>' + ''.join(f'<li>{_inline(i)}</li>' for i in items) + f'</{tag}>')
            items.clear()
        kind = None

    def flush_quote():
        if quote:
            html.append('<blockquote>' + ''.join(f'<p>{_inline(q)}</p>' for q in quote if q) + '</blockquote>')
            quote.clear()

    def flush_all():
        flush_para()
        flush_list()
        flush_quote()

    for raw in lines:
        line = raw.strip()
        if not line:
            flush_all()
            continue
        if line.startswith('>'):
            flush_para()
            flush_list()
            quote.append(line[1:].strip())
            continue
        flush_quote()
        m = _UL.match(line) or _OL.match(line)
        if m:
            flush_para()
            new_kind = 'ul' if _UL.match(line) else 'ol'
            if kind and kind != new_kind:
                flush_list()
            kind = new_kind
            items.append(m.group(1))
            continue
        flush_list()
        if line in ('---', '***', '___'):
            flush_para()
            html.append('<hr>')
            continue
        m = _HEADING.match(line)
        if m:
            flush_para()
            level = 2 if len(m.group(1)) <= 2 else 3
            text = m.group(2).strip()
            html.append(f'<h{level} id="{heading_id(text)}">{_inline(text)}</h{level}>')
            continue
        m = _IMAGE_LINE.match(line)
        if m:
            src = _url(escape(m.group(2), quote=True))
            if src:
                flush_para()
                alt, caption = escape(m.group(1), quote=True), m.group(3)
                figcap = f'<figcaption>{_inline(caption)}</figcaption>' if caption else ''
                html.append(f'<figure><img src="{src}" alt="{alt}" loading="lazy">{figcap}</figure>')
                continue
        para.append(line)
    flush_all()
    return '\n'.join(html)


def plain_text(markdown):
    """The body without markup, for word counts and descriptions."""
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', markdown or '')
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'[#>*_`]|^\s*[-*]\s+|^\s*\d+[.)]\s+|^-{3,}$', ' ', text, flags=re.M)
    return ' '.join(text.split())


def reading_minutes(markdown):
    return max(1, round(len(plain_text(markdown).split()) / WORDS_PER_MINUTE))


def description(article):
    if article.excerpt:
        return article.excerpt
    text = plain_text(article.body)
    return text[:157].rsplit(' ', 1)[0] + '…' if len(text) > 160 else text


def headings(markdown):
    """[{id, text, level}] of the body's sections, for a table of contents."""
    out = []
    for line in (markdown or '').splitlines():
        m = _HEADING.match(line.strip())
        if m:
            text = plain_text(m.group(2))
            out.append({'id': heading_id(m.group(2).strip()), 'text': text, 'level': 2 if len(m.group(1)) <= 2 else 3})
    return out


# ---- data for the API ----

def _abs(request, f):
    if not f:
        return None
    url = f.url
    return url if url.startswith('http') or request is None else request.build_absolute_uri(url)


def theme_card(theme_id):
    entry = themes.get(theme_id) if theme_id else None
    if not entry or entry.get('status') != 'active':
        return None
    return {'id': theme_id, 'name': entry['name'], 'preview': entry.get('previewImage'),
            'category': (entry.get('catalog') or {}).get('category', '')}


def card(article, request=None):
    return {
        'slug': article.slug, 'title': article.title, 'category': article.category,
        'category_label': CATEGORY_LABELS.get(article.category, article.category),
        'excerpt': description(article), 'cover': _abs(request, article.cover), 'cover_alt': article.cover_alt,
        'published_at': article.published_at.isoformat() if article.published_at else None,
        'reading_minutes': reading_minutes(article.body), 'author_name': article.author_name,
    }


def full(article, request=None):
    return {
        **card(article, request), 'html': render(article.body), 'toc': headings(article.body),
        'seo_title': article.seo_title or article.title, 'theme': theme_card(article.theme),
        'updated_at': article.updated_at.isoformat() if article.updated_at else None,
    }


def related(article, n=3):
    others = live().exclude(pk=article.pk)
    same = list(others.filter(category=article.category)[:n])
    if len(same) < n:
        same += list(others.exclude(pk__in=[a.pk for a in same])[:n - len(same)])
    return same


# ---- HTML for crawlers, the sitemap and the feed ----

def _origin():
    return settings.FRONTEND_URL.rstrip('/')


PAGE_CSP = ("default-src 'none'; style-src 'unsafe-inline'; img-src 'self' https: data:; base-uri 'none'; "
            "form-action 'none'; frame-ancestors 'none'")
_STYLE = ('body{font:17px/1.7 Georgia,serif;color:#221A1F;background:#FBF9F6;max-width:720px;margin:0 auto;padding:24px}'
          'img{max-width:100%;height:auto}a{color:#8E6A2C}nav a{margin-right:16px}h1{line-height:1.1}'
          'blockquote{border-left:3px solid #D2AE62;margin-left:0;padding-left:16px;color:#4E4349}')


def _page(title, desc, url, body, image=None, extra_head=''):
    og_image = f'<meta property="og:image" content="{escape(image)}" />' if image else ''
    html = f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(desc)}" />
  <link rel="canonical" href="{escape(url)}" />
  <link rel="alternate" type="application/rss+xml" title="Blog {SITE_NAME}" href="{escape(_origin())}/blog/rss.xml" />
  <meta property="og:site_name" content="{SITE_NAME}" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{escape(desc)}" />
  <meta property="og:url" content="{escape(url)}" />
  <meta property="og:locale" content="id_ID" />
  {og_image}
  <meta name="twitter:card" content="{'summary_large_image' if image else 'summary'}" />
  {extra_head}
  <style>{_STYLE}</style>
</head>
<body>
  <nav><a href="/">{SITE_NAME}</a><a href="/blog">Blog</a><a href="/tema">Tema</a></nav>
  {body}
  <footer><p><a href="/register">Buat undangan pernikahan digital di {SITE_NAME}</a></p></footer>
</body>
</html>'''
    response = HttpResponse(html, content_type='text/html; charset=utf-8')
    response['Content-Security-Policy'] = PAGE_CSP
    response['Cache-Control'] = 'public, max-age=300'
    return response


@require_GET
def index_page(request):
    """/blog for crawlers: the latest articles, linked."""
    category = request.GET.get('kategori', '')
    articles = live()
    if category in CATEGORY_LABELS:
        articles = articles.filter(category=category)
    items = ''.join(
        f'<li><a href="/blog/{a.slug}">{escape(a.title)}</a> · {escape(CATEGORY_LABELS[a.category])}'
        f'<br>{escape(description(a))}</li>' for a in articles[:100])
    return _page(f'Blog · Inspirasi dan panduan pernikahan · {SITE_NAME}',
                 'Inspirasi, adat, dan panduan persiapan pernikahan dari Vowvella: undangan digital, tema berlukis, '
                 'dan etiket mengundang tamu.',
                 f'{_origin()}/blog',
                 f'<h1>Blog {SITE_NAME}</h1><ul>{items or "<li>Belum ada artikel.</li>"}</ul>')


@require_GET
def article_page(request, slug):
    """/blog/<slug> for crawlers: the whole article, its tags and JSON-LD."""
    article = live().filter(slug=slug).first()
    if not article:
        raise Http404
    url = f'{_origin()}/blog/{article.slug}'
    desc = description(article)
    image = _abs(request, article.cover)
    ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': article.title,
        'description': desc, 'url': url, 'mainEntityOfPage': url, 'inLanguage': 'id-ID',
        'datePublished': article.published_at.isoformat(), 'dateModified': article.updated_at.isoformat(),
        'author': {'@type': 'Organization' if article.author_name.startswith('Tim ') else 'Person',
                   'name': article.author_name},
        'publisher': {'@type': 'Organization', 'name': SITE_NAME, 'url': _origin() or '/'},
        'articleSection': CATEGORY_LABELS.get(article.category, ''),
        **({'image': [image]} if image else {}),
    }
    # JSON in a <script> must not be able to close the tag.
    ld_json = json.dumps(ld, ensure_ascii=False).replace('</', '<\\/')
    extra = (f'<meta property="og:type" content="article" />'
             f'<meta property="article:published_time" content="{article.published_at.isoformat()}" />'
             f'<script type="application/ld+json">{ld_json}</script>')
    more = ''.join(f'<li><a href="/blog/{a.slug}">{escape(a.title)}</a></li>' for a in related(article))
    cover = (f'<img src="{escape(image)}" alt="{escape(article.cover_alt or article.title)}">' if image else '')
    body = (f'<article><p>{escape(CATEGORY_LABELS.get(article.category, ""))}</p>'
            f'<h1>{escape(article.title)}</h1>'
            f'<p>{escape(article.author_name)} · <time datetime="{article.published_at.isoformat()}">'
            f'{timezone.localtime(article.published_at):%d-%m-%Y}</time> · {reading_minutes(article.body)} menit baca</p>'
            f'{cover}{render(article.body)}</article>'
            + (f'<h2>Baca juga</h2><ul>{more}</ul>' if more else ''))
    return _page(f'{article.seo_title or article.title} · {SITE_NAME}', desc, url, body, image, extra)


@require_GET
def sitemap(request):
    """/sitemap-blog.xml: the blog index and every live article."""
    origin = _origin()
    articles = live().only('slug', 'updated_at')
    newest = articles.order_by('-updated_at').values_list('updated_at', flat=True).first()
    rows = [f'  <url><loc>{escape(origin)}/blog</loc>'
            + (f'<lastmod>{newest.date().isoformat()}</lastmod>' if newest else '') + '</url>']
    rows += [f'  <url><loc>{escape(origin)}/blog/{a.slug}</loc><lastmod>{a.updated_at.date().isoformat()}</lastmod></url>'
             for a in articles]
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + '\n'.join(rows) + '\n</urlset>\n')
    response = HttpResponse(xml, content_type='application/xml; charset=utf-8')
    response['Cache-Control'] = 'public, max-age=900'
    return response


@require_GET
def rss(request):
    """/blog/rss.xml: the latest 30 articles."""
    origin = _origin()
    items = []
    for a in live()[:30]:
        link = f'{origin}/blog/{a.slug}'
        items.append(
            f'<item><title>{escape(a.title)}</title><link>{escape(link)}</link><guid>{escape(link)}</guid>'
            f'<pubDate>{a.published_at.strftime("%a, %d %b %Y %H:%M:%S +0000")}</pubDate>'
            f'<category>{escape(CATEGORY_LABELS.get(a.category, ""))}</category>'
            f'<description>{escape(description(a))}</description></item>')
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>'
           f'<title>Blog {SITE_NAME}</title><link>{escape(origin)}/blog</link>'
           '<description>Inspirasi, adat, dan panduan persiapan pernikahan.</description><language>id</language>'
           + ''.join(items) + '</channel></rss>\n')
    response = HttpResponse(xml, content_type='application/rss+xml; charset=utf-8')
    response['Cache-Control'] = 'public, max-age=900'
    return response



# ---- the public API (the SPA's /blog pages) ----

PAGE_SIZE = 12


class ArticleListView(APIView):
    """GET live articles, newest first: ?kategori=, ?page=, ?limit= (max 12)."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        qs = live()
        category = request.query_params.get('kategori', '')
        if category in CATEGORY_LABELS:
            qs = qs.filter(category=category)
        try:
            size = min(PAGE_SIZE, max(1, int(request.query_params.get('limit', PAGE_SIZE))))
            page = max(1, int(request.query_params.get('page', 1)))
        except ValueError:
            size, page = PAGE_SIZE, 1
        count = qs.count()
        rows = qs[(page - 1) * size: page * size]
        counts = {k: 0 for k in CATEGORY_LABELS}
        for key in live().values_list('category', flat=True):
            counts[key] = counts.get(key, 0) + 1
        return Response({
            'count': count, 'page': page, 'pages': max(1, -(-count // size)),
            'results': [card(a, request) for a in rows],
            'categories': [{'key': k, 'label': v, 'count': counts.get(k, 0)} for k, v in Article.CATEGORIES],
        })


class ArticleDetailView(APIView):
    """GET one live article with its HTML, sections and related articles."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, slug):
        article = live().filter(slug=slug).first()
        if not article:
            return Response({'detail': 'Artikel tidak ditemukan.'}, status=404)
        return Response({**full(article, request), 'related': [card(a, request) for a in related(article)]})


# ---- writing (the backoffice, staff_views.py) ----

def state(article, now=None):
    """'draft', 'scheduled' or 'live'."""
    if article.status != 'published' or not article.published_at:
        return 'draft'
    return 'live' if article.published_at <= (now or timezone.now()) else 'scheduled'


def clean(data, instance=None):
    """(fields, errors) from the backoffice editor; errors by field, in
    Indonesian. A live article keeps its address (links and search results
    point at it)."""
    from .vouchers import _when   # same reading of times: no offset means WIB

    errors, out = {}, {}

    def given(name):
        return name in data or instance is None

    def text(name, limit, required=False, label=''):
        if not given(name):
            return
        value = str(data.get(name) or '').strip()
        if required and not value:
            errors[name] = f'{label} wajib diisi.'
        elif len(value) > limit:
            errors[name] = f'{label} paling panjang {limit} karakter.'
        out[name] = value

    text('title', 140, True, 'Judul')
    text('excerpt', 200, label='Ringkasan')
    text('cover_alt', 160, label='Teks alt sampul')
    text('seo_title', 70, label='Judul di pencarian')
    if given('author_name'):
        out['author_name'] = str(data.get('author_name') or '').strip()[:80] or 'Tim Vowvella'
    if given('body'):
        out['body'] = str(data.get('body') or '')
    if given('category'):
        if data.get('category', 'inspirasi') not in CATEGORY_LABELS:
            errors['category'] = 'Kategori tidak dikenal.'
        out['category'] = data.get('category') or 'inspirasi'
    if given('theme'):
        theme = str(data.get('theme') or '')
        if theme and not themes.get(theme):
            errors['theme'] = 'Tema tidak dikenal.'
        out['theme'] = theme

    if 'slug' in data:
        slug = slugify(str(data.get('slug') or ''))[:120]
        if not slug:
            errors['slug'] = 'Alamat hanya huruf kecil, angka dan tanda hubung.'
        elif Article.objects.filter(slug=slug).exclude(pk=getattr(instance, 'pk', None)).exists():
            errors['slug'] = 'Alamat ini sudah dipakai artikel lain.'
        elif instance and instance.pk and slug != instance.slug and is_live(instance):
            errors['slug'] = 'Artikel yang sudah terbit tidak bisa ganti alamat.'
        out['slug'] = slug
    elif instance is None and out.get('title'):
        out['slug'] = unique_slug(out['title'])

    if 'status' in data:
        if data['status'] not in ('draft', 'published'):
            errors['status'] = 'Status tidak dikenal.'
        out['status'] = data['status']
    if 'published_at' in data:
        try:
            out['published_at'] = _when(data.get('published_at'))
        except ValueError:
            errors['published_at'] = 'Tanggal dan jam tidak dikenali.'
    status = out.get('status', getattr(instance, 'status', 'draft'))
    if status == 'published':
        body = out.get('body', getattr(instance, 'body', ''))
        if not plain_text(body):
            errors['body'] = 'Isi artikel masih kosong.'
        # Published without a time (or with it cleared) means now.
        if out.get('published_at', getattr(instance, 'published_at', None)) is None:
            out['published_at'] = timezone.now()
    return out, errors


def staff_row(article, request=None):
    return {
        'id': article.pk, 'title': article.title, 'slug': article.slug, 'category': article.category,
        'category_label': CATEGORY_LABELS.get(article.category, article.category), 'status': article.status,
        'state': state(article), 'published_at': article.published_at.isoformat() if article.published_at else None,
        'updated_at': article.updated_at.isoformat() if article.updated_at else None,
        'author_name': article.author_name, 'excerpt': article.excerpt, 'description': description(article),
        'cover': _abs(request, article.cover), 'reading_minutes': reading_minutes(article.body),
        'words': len(plain_text(article.body).split()),
    }


def staff_detail(article, request=None):
    return {**staff_row(article, request), 'body': article.body, 'cover_alt': article.cover_alt,
            'theme': article.theme, 'seo_title': article.seo_title,
            'created_by': article.created_by.username if article.created_by else None}
