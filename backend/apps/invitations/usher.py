"""Mode Penerima Tamu: the ushers at the door, on their own phones.

The couple switches it on and shares one link (/penerima/<token>). Whoever has
the link can, around the wedding days only:
- see the guest list (names, groups, sessions, RSVP answers; no phone numbers);
- check guests in by scanning their personal-link QR code or by name, noting
  how many came, the number written on their envelope (amplop), and whether
  they took a souvenir;
- add walk-ins who aren't on the list;
- feed the welcome screen (/penerima/<token>/layar) the latest arrivals.

The link is only a token: it opens WINDOW_DAYS before the first event and
closes WINDOW_DAYS after the last, and the couple can switch it off or rotate
it. The logged-in couple can use it at any time, to rehearse."""
import secrets
from datetime import timedelta
from zoneinfo import ZoneInfo

from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import audience, csv_export
from .copy import event_label
from .editor_views import _owned
from .headcount import _latest_answers, summarise
from .models import Guest, Invitation, find_guest
from .throttling import ClientIPScopedRateThrottle
from .views import _owner_or_error

WINDOW_DAYS = 2
MAX_ARRIVED = 50


def new_token():
    return secrets.token_urlsafe(18)


def window(invitation):
    """(first day, last day) the ushers' link works, as local dates."""
    days = []
    for e in invitation.events.all():
        tz = ZoneInfo(e.timezone)
        days += [e.start.astimezone(tz).date()] + ([e.end.astimezone(tz).date()] if e.end else [])
    if not days:
        days = [invitation.wedding_date]
    return min(days) - timedelta(days=WINDOW_DAYS), max(days) + timedelta(days=WINDOW_DAYS)


def window_open(invitation, today=None):
    start, end = window(invitation)
    today = today or timezone.localdate(timezone=ZoneInfo('Asia/Jakarta'))
    return start <= today <= end


class UsherThrottle(ClientIPScopedRateThrottle):
    """Several ushers and a welcome screen share the venue's Wi-Fi (one IP) and
    poll, so the limit is per IP but generous. Rate kept here, not in settings."""
    scope = 'usher'

    def get_rate(self):
        return '3000/hour'


class _UsherView(APIView):
    """Resolves the token. 404 for an unknown or switched-off link; 403 outside
    the wedding days unless the caller is the couple (or staff)."""
    permission_classes = [AllowAny]
    throttle_classes = [UsherThrottle]
    throttle_scope = 'usher'

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        token = kwargs.get('token') or ''
        inv = Invitation.objects.filter(usher_token=token, usher_enabled=True).first() if len(token) >= 16 else None
        self.invitation = inv

    def handle(self, request, fn):
        inv = self.invitation
        if inv is None:
            return Response({'detail': 'Link penerima tamu tidak ditemukan atau sudah dimatikan.'}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        own = user.is_authenticated and (user.is_staff or inv.couple_user_id == user.id)
        if not own and not window_open(inv):
            start, end = window(inv)
            return Response({'detail': f'Link penerima tamu aktif {start:%d/%m/%Y} sampai {end:%d/%m/%Y}.',
                             'opens': start, 'closes': end}, status=status.HTTP_403_FORBIDDEN)
        return fn(inv)


def _sessions(guest, events, variant):
    """Labels of the group-only events this guest sees, e.g. ["Resepsi Sesi 1"]."""
    return [event_label(e.event_type, variant, e.title) for e in events if e.groups and audience.sees(e.groups, guest)]


def guest_row(guest, answers, events, variant):
    rsvp = answers.get(guest.id)
    return {
        'id': guest.id, 'name': guest.name, 'group': guest.group, 'code': guest.code, 'max_pax': guest.max_pax,
        'is_walk_in': guest.is_walk_in, 'checked_in': guest.checked_in, 'checked_in_at': guest.checked_in_at,
        'arrived_pax': guest.arrived_pax, 'envelope_no': guest.envelope_no, 'souvenir_given': guest.souvenir_given,
        'rsvp': {'attending': rsvp.attending, 'pax': rsvp.pax} if rsvp else None,
        'sessions': _sessions(guest, events, variant),
    }


def stats(inv):
    guests = inv.guests.all()
    arrived = guests.filter(checked_in=True)
    invited = [g for g in guests if not g.is_walk_in]
    answers, general = _latest_answers(inv)
    given = guests.filter(souvenir_given=True).count()
    return {
        'invited': len(invited),
        'arrived': arrived.count(),
        'arrived_pax': arrived.aggregate(n=Sum('arrived_pax'))['n'] or 0,
        'walk_ins': guests.filter(is_walk_in=True).count(),
        'expected_pax': summarise(invited, answers, general)['estimate_max'],
        'souvenirs_given': given,
        'souvenir_stock': inv.souvenir_stock,
        'souvenirs_left': None if inv.souvenir_stock is None else max(inv.souvenir_stock - given, 0),
    }


def _couple(inv):
    couple = getattr(inv, 'couple', None)
    return {'bride': couple.bride_name if couple else '', 'groom': couple.groom_name if couple else ''}


def _clean_pax(value, default=1):
    try:
        n = int(value)
    except (TypeError, ValueError):
        return default
    return min(max(n, 1), MAX_ARRIVED)


def _check_in(guest, data):
    guest.checked_in = True
    guest.checked_in_at = timezone.now()
    guest.arrived_pax = _clean_pax(data.get('arrived_pax'), default=guest.max_pax or 1)
    guest.envelope_no = str(data.get('envelope_no') or '').strip()[:20]
    guest.souvenir_given = bool(data.get('souvenir'))
    guest.save(update_fields=['checked_in', 'checked_in_at', 'arrived_pax', 'envelope_no', 'souvenir_given'])


class UsherHomeView(_UsherView):
    """GET: everything the usher screen needs, in one request."""

    def get(self, request, token):
        def body(inv):
            events = list(inv.events.all())
            answers, _ = _latest_answers(inv)
            return Response({
                'slug': inv.slug, 'theme': inv.theme, 'couple': _couple(inv),
                'events': [{'id': e.id, 'label': event_label(e.event_type, inv.copy_variant, e.title),
                            'start': e.start, 'timezone': e.timezone, 'groups': e.groups} for e in events],
                'stats': stats(inv),
                'guests': [guest_row(g, answers, events, inv.copy_variant) for g in inv.guests.all()],
            })
        return self.handle(request, body)


class UsherCheckInView(_UsherView):
    """POST {guest_id | code, arrived_pax, envelope_no, souvenir}. A guest who is
    already in answers 200 with `already: true` and is left unchanged."""

    def post(self, request, token):
        def body(inv):
            data = request.data
            guest = None
            if data.get('guest_id'):
                guest = inv.guests.filter(pk=data.get('guest_id')).first()
            elif data.get('code'):
                guest = find_guest(inv, str(data.get('code')))
            if guest is None:
                return Response({'detail': 'Tamu tidak ada di daftar undangan ini.'}, status=status.HTTP_404_NOT_FOUND)
            already = guest.checked_in
            if not already:
                _check_in(guest, data)
            answers, _ = _latest_answers(inv)
            return Response({'already': already, 'guest': guest_row(guest, answers, list(inv.events.all()), inv.copy_variant),
                             'stats': stats(inv)})
        return self.handle(request, body)


class UsherWalkInView(_UsherView):
    """POST {name, group?, arrived_pax, envelope_no, souvenir}: a guest who isn't on the list."""

    def post(self, request, token):
        def body(inv):
            name = ' '.join(str(request.data.get('name') or '').split())[:200]
            if not name:
                return Response({'name': ['Nama wajib diisi.']}, status=status.HTTP_400_BAD_REQUEST)
            guest = Guest(invitation=inv, name=name, group=str(request.data.get('group') or '').strip()[:100], is_walk_in=True)
            guest.save()
            _check_in(guest, request.data)
            answers, _ = _latest_answers(inv)
            return Response({'guest': guest_row(guest, answers, list(inv.events.all()), inv.copy_variant), 'stats': stats(inv)},
                            status=status.HTTP_201_CREATED)
        return self.handle(request, body)


class UsherGuestView(_UsherView):
    """PATCH {arrived_pax?, envelope_no?, souvenir_given?} after check-in;
    POST .../undo/ takes a check-in back (a walk-in added by mistake is removed)."""

    def patch(self, request, token, pk):
        def body(inv):
            guest = inv.guests.filter(pk=pk, checked_in=True).first()
            if guest is None:
                return Response({'detail': 'Tamu belum check-in.'}, status=status.HTTP_404_NOT_FOUND)
            data = request.data
            if 'arrived_pax' in data:
                guest.arrived_pax = _clean_pax(data['arrived_pax'], default=guest.arrived_pax or 1)
            if 'envelope_no' in data:
                guest.envelope_no = str(data['envelope_no'] or '').strip()[:20]
            if 'souvenir_given' in data:
                guest.souvenir_given = bool(data['souvenir_given'])
            guest.save(update_fields=['arrived_pax', 'envelope_no', 'souvenir_given'])
            answers, _ = _latest_answers(inv)
            return Response({'guest': guest_row(guest, answers, list(inv.events.all()), inv.copy_variant), 'stats': stats(inv)})
        return self.handle(request, body)


class UsherUndoView(_UsherView):
    def post(self, request, token, pk):
        def body(inv):
            guest = inv.guests.filter(pk=pk).first()
            if guest is None:
                return Response({'detail': 'Tamu tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
            if guest.is_walk_in:
                guest.delete()
                return Response({'removed': True, 'stats': stats(inv)})
            guest.checked_in, guest.checked_in_at, guest.arrived_pax = False, None, None
            guest.envelope_no, guest.souvenir_given = '', False
            guest.save(update_fields=['checked_in', 'checked_in_at', 'arrived_pax', 'envelope_no', 'souvenir_given'])
            answers, _ = _latest_answers(inv)
            return Response({'guest': guest_row(guest, answers, list(inv.events.all()), inv.copy_variant), 'stats': stats(inv)})
        return self.handle(request, body)


class UsherArrivalsView(_UsherView):
    """GET: the latest arrivals for the welcome screen (polled)."""

    def get(self, request, token):
        def body(inv):
            latest = inv.guests.filter(checked_in=True).order_by('-checked_in_at', '-id')[:8]
            return Response({
                'slug': inv.slug, 'theme': inv.theme, 'couple': _couple(inv),
                'arrivals': [{'id': g.id, 'name': g.name, 'group': g.group, 'checked_in_at': g.checked_in_at} for g in latest],
            })
        return self.handle(request, body)


# ----- the couple's side -----

class MyUsherView(APIView):
    """GET the venue-mode settings and live numbers; PATCH {usher_enabled?,
    souvenir_stock?, rotate?}. The token is made when first switched on."""
    permission_classes = [IsAuthenticated]

    def _body(self, inv):
        start, end = window(inv)
        return {'usher_enabled': inv.usher_enabled, 'token': inv.usher_token if inv.usher_enabled else '',
                'window_start': start, 'window_end': end, 'window_open': window_open(inv),
                'souvenir_stock': inv.souvenir_stock, 'stats': stats(inv)}

    def get(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(self._body(inv))

    def patch(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        if 'usher_enabled' in data:
            inv.usher_enabled = bool(data['usher_enabled'])
        if 'souvenir_stock' in data:
            raw = data['souvenir_stock']
            if raw in (None, ''):
                inv.souvenir_stock = None
            else:
                try:
                    inv.souvenir_stock = max(int(raw), 0)
                except (TypeError, ValueError):
                    return Response({'souvenir_stock': ['Isi angka.']}, status=status.HTTP_400_BAD_REQUEST)
        if data.get('rotate') or (inv.usher_enabled and not inv.usher_token):
            inv.usher_token = new_token()
        inv.save(update_fields=['usher_enabled', 'usher_token', 'souvenir_stock'])
        return Response(self._body(inv))


GUESTBOOK_HEADER = ['Nama', 'Grup', 'Tanpa undangan', 'Check-in', 'Jumlah orang', 'No. amplop', 'Suvenir', 'Ucapan']


def guestbook_csv(inv):
    """The digital guestbook after the event: who came, when, how many, their envelope number."""
    import csv
    import io
    primary = inv.events.filter(is_primary=True).first()
    tz_name = primary.timezone if primary else 'Asia/Jakarta'
    answers, _ = _latest_answers(inv)
    out = io.StringIO()
    out.write('﻿')
    writer = csv.writer(out)
    writer.writerow(GUESTBOOK_HEADER)
    for g in inv.guests.filter(checked_in=True).order_by('checked_in_at', 'id'):
        rsvp = answers.get(g.id)
        writer.writerow([
            csv_export.safe_cell(g.name), csv_export.safe_cell(g.group), 'Ya' if g.is_walk_in else '',
            csv_export._stamp(g.checked_in_at, tz_name) if g.checked_in_at else '', g.arrived_pax or '',
            csv_export.safe_cell(g.envelope_no), 'Ya' if g.souvenir_given else '',
            csv_export.safe_cell(rsvp.wishes if rsvp else ''),
        ])
    return out.getvalue()


class GuestbookCsvView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        inv, error = _owner_or_error(request, slug)
        if error:
            return error
        response = HttpResponse(guestbook_csv(inv), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="buku-tamu-{inv.slug}.csv"'
        return response
