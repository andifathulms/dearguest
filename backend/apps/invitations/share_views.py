"""Server-rendered share page with per-invitation Open Graph tags.

The SPA can't provide per-invitation link previews (crawlers don't run JS),
so social crawlers read this page's OG tags while humans are redirected to
the real invitation on the frontend.

Drafts, expired and unknown invitations all get the same generic DearGuest
page with a 404, so a shared link never leaks names or photos before (or
after) the invitation is public.
"""
import json

from django.conf import settings
from django.http import HttpResponse
from django.utils.html import escape

from .models import Invitation, Couple
from .views import is_public

GENERIC_TITLE = 'Dear Guest — Undangan Pernikahan Digital'
GENERIC_DESC = 'Undangan pernikahan digital untuk pasangan Indonesia.'


def _couple(inv):
    try:
        return inv.couple
    except Couple.DoesNotExist:
        return None


def _render(title, desc, target, image=None, status=200):
    # json.dumps gives a valid JS string; escaping '<' keeps "</script>" inert.
    target_js = json.dumps(target).replace('<', '\\u003c')
    og_image = f'<meta property="og:image" content="{escape(image)}" />' if image else ''
    tw_image = f'<meta name="twitter:image" content="{escape(image)}" />' if image else ''
    html = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{escape(title)}" />
  <meta property="og:description" content="{escape(desc)}" />
  <meta property="og:url" content="{escape(target)}" />
  {og_image}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{escape(title)}" />
  <meta name="twitter:description" content="{escape(desc)}" />
  {tw_image}
  <meta http-equiv="refresh" content="0; url={escape(target)}" />
  <script>window.location.replace({target_js});</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:3rem;color:#6b5f50">
  <p>Membuka undangan…</p>
  <p><a href="{escape(target)}">Klik di sini bila tidak teralihkan otomatis.</a></p>
</body>
</html>"""
    return HttpResponse(html, status=status)


def share_view(request, slug):
    inv = Invitation.objects.filter(slug=slug).first()
    if not inv or not is_public(inv):
        # The SPA shows "belum aktif" / "tidak ditemukan" itself; no couple data here.
        return _render(GENERIC_TITLE, GENERIC_DESC, f"{settings.FRONTEND_URL}/{slug}", status=404)

    couple = _couple(inv)
    bride = (couple.bride_name if couple else '') or ''
    groom = (couple.groom_name if couple else '') or ''
    names = f"{bride} & {groom}".strip(' &') or 'Undangan Pernikahan'

    desc = 'Dengan penuh sukacita, kami mengundang Anda ke pernikahan kami.'

    # Pick a representative image: bride photo, groom photo, or first gallery photo.
    image = None
    for field in [(couple.bride_photo if couple else None), (couple.groom_photo if couple else None)]:
        if field:
            image = request.build_absolute_uri(field.url)
            break
    if not image:
        first_photo = inv.photos.first()
        if first_photo and first_photo.image:
            image = request.build_absolute_uri(first_photo.image.url)

    # Preserve query (e.g. ?to=Guest) when redirecting humans to the invitation.
    qs = request.META.get('QUERY_STRING', '')
    target = f"{settings.FRONTEND_URL}/{slug}" + (f"?{qs}" if qs else '')

    return _render(f"The Wedding of {names}", desc, target, image=image)
