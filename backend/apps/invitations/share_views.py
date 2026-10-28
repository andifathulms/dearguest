"""Server-rendered pages for link previews (Open Graph tags).

The SPA can't provide per-invitation link previews (crawlers don't run JS), so:
- nginx (prod) and Vite (dev) send crawler user-agents asking for `/<slug>` or
  `/<slug>/<code>` here (crawler_view); people get the SPA;
- `/share/<slug>/` still works for everyone: crawlers read the tags, people
  are redirected to the invitation (share_view);
- the preview image is drawn by og.py and served from `/og/...` (og_image_view).

Drafts, expired and unknown invitations all get the same generic DearGuest
page with a 404, so a shared link never leaks names before (or after) the
invitation is public. Personal previews come only from a guest-list code;
`?to=` is never read here.
"""
import json
from urllib.parse import parse_qs

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, HttpResponseRedirect
from django.utils.html import escape

from . import og
from .copy import t
from .entitlements import has_feature
from .models import Couple, Invitation, find_guest
from .views import is_public

GENERIC_TITLE = 'DearGuest · Undangan Pernikahan Digital'
GENERIC_DESC = 'Undangan pernikahan digital untuk pasangan Indonesia.'
SITE_NAME = 'DearGuest'
NOINDEX = 'noindex, nofollow'
# First path segments that belong to the site, not to an invitation. A crawler
# asking for one of these gets the site's own tags.
SITE_PATHS = {
    'tema', 'register', 'dashboard', 'forgot-password', 'reset-password', 'my',
    'onboarding', 'admin', 'api', 'media', 'share', 'og', 'static', 'assets',
}


def _couple(inv):
    try:
        return inv.couple
    except Couple.DoesNotExist:
        return None


def _render(title, desc, url, image=None, redirect=None, status=200):
    """The tag page. `redirect` sends people on (only /share/ does: crawler_view
    is the canonical URL itself, so redirecting there would loop)."""
    tags = [
        ('property', 'og:type', 'website'),
        ('property', 'og:site_name', SITE_NAME),
        ('property', 'og:locale', 'id_ID'),
        ('property', 'og:title', title),
        ('property', 'og:description', desc),
        ('property', 'og:url', url),
        ('name', 'twitter:card', 'summary_large_image' if image else 'summary'),
        ('name', 'twitter:title', title),
        ('name', 'twitter:description', desc),
    ]
    if image:
        tags += [
            ('property', 'og:image', image),
            ('property', 'og:image:secure_url', image),
            ('property', 'og:image:type', 'image/jpeg'),
            ('property', 'og:image:width', str(og.SIZE[0])),
            ('property', 'og:image:height', str(og.SIZE[1])),
            ('property', 'og:image:alt', title),
            ('name', 'twitter:image', image),
        ]
    meta = '\n  '.join(f'<meta {attr}="{key}" content="{escape(value)}" />' for attr, key, value in tags)
    go = ''
    if redirect:
        # json.dumps gives a valid JS string; escaping '<' keeps "</script>" inert.
        target_js = json.dumps(redirect).replace('<', '\\u003c')
        go = (f'<meta http-equiv="refresh" content="0; url={escape(redirect)}" />\n'
              f'  <script>window.location.replace({target_js});</script>')
    link = escape(redirect or url)
    html = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="{NOINDEX}" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(desc)}" />
  <link rel="canonical" href="{escape(url)}" />
  {meta}
  {go}
</head>
<body style="font-family:sans-serif;text-align:center;padding:3rem;color:#6b5f50">
  <p>{escape(title)}</p>
  <p><a href="{link}">Buka undangan</a></p>
</body>
</html>"""
    response = HttpResponse(html, status=status)
    response['X-Robots-Tag'] = NOINDEX
    return response


def _link(slug, code=None):
    return f"{settings.FRONTEND_URL}/{slug}" + (f"/{code}" if code else '')


def preview(inv, guest=None):
    """Title, description and image URL for a public invitation."""
    if guest and not has_feature(inv, 'personalised_preview'):
        guest = None
    data = og.preview_data(inv, guest)
    variant = inv.copy_variant
    couple = _couple(inv)
    names = {'bride': (couple.bride_name if couple else '') or '',
             'groom': (couple.groom_name if couple else '') or ''}
    if not (names['bride'] and names['groom']):
        title = t('og.label', variant)
    elif guest:
        title = t('og.titleGuest', variant, guest=data['guest'], **names)
    else:
        title = t('og.title', variant, **names)
    greeting = t('share.greeting', variant)
    desc = (t('og.description', variant, greeting=greeting, date=data['date']) if data['date']
            else t('og.descriptionNoDate', variant, greeting=greeting))
    image = og.image_url(inv.slug, guest.code if guest else None, og.preview_hash(data))
    return title, desc, image, guest


def _generic(url, redirect=None):
    return _render(GENERIC_TITLE, GENERIC_DESC, url, redirect=redirect, status=404)


def crawler_view(request, slug, code=None):
    """`/<slug>` and `/<slug>/<code>` as a crawler sees them."""
    if slug in SITE_PATHS:
        return _render(GENERIC_TITLE, GENERIC_DESC, f"{settings.FRONTEND_URL}/{slug}")
    inv = Invitation.objects.filter(slug=slug).first()
    if not inv or not is_public(inv):
        return _generic(_link(slug))
    guest = find_guest(inv, code) if code else None
    title, desc, image, guest = preview(inv, guest)
    return _render(title, desc, _link(slug, guest.code if guest else None), image=image)


def share_view(request, slug):
    """Legacy `/share/<slug>/` links (± `?to=` / `&g=`): tags for crawlers,
    then people go on to the invitation."""
    query = request.META.get('QUERY_STRING', '')
    inv = Invitation.objects.filter(slug=slug).first()
    if not inv or not is_public(inv):
        # The SPA shows "belum aktif" / "tidak ditemukan" itself; no couple data here.
        return _generic(_link(slug), redirect=_link(slug))

    code = (parse_qs(query).get('g') or [''])[0]
    guest = find_guest(inv, code) if code else None
    title, desc, image, guest = preview(inv, guest)
    if guest:
        target = _link(slug, guest.code)
    else:
        # A plain link keeps its query (e.g. ?to=Guest) for the cover.
        target = _link(slug) + (f"?{query}" if query else '')
    return _render(title, desc, _link(slug, guest.code if guest else None), image=image, redirect=target)


def og_image_view(request, slug, digest, code=None):
    """`/og/<slug>[/<code>]/<hash>.jpg`. The hash is in the URL so the response
    can be cached forever; an outdated hash redirects to the current image."""
    inv = Invitation.objects.filter(slug=slug).first()
    if not inv or not is_public(inv):
        raise Http404
    guest = None
    if code:
        guest = find_guest(inv, code)
        if not guest or not has_feature(inv, 'personalised_preview'):
            raise Http404
    data = og.preview_data(inv, guest)
    current = og.preview_hash(data)
    if digest != current:
        response = HttpResponseRedirect('/' + og.image_path(slug, guest.code if guest else None, current))
        response['Cache-Control'] = 'no-cache'
        return response
    path = og.ensure_rendered(slug, guest.code if guest else None, data, current)
    response = FileResponse(open(path, 'rb'), content_type='image/jpeg')
    response['Cache-Control'] = 'public, max-age=31536000, immutable'
    response['X-Robots-Tag'] = NOINDEX
    return response
