from datetime import date
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework.views import APIView
from .models import MAX_PAX, Invitation, RSVP, Guest, Coupon, MusicPreset, normalise_whatsapp
from .serializers import MusicPresetSerializer
from . import csv_export, ics, maps, moderation
from .throttling import client_ip
from .serializers import (
    InvitationPublicSerializer,
    RSVPSerializer,
    RSVPCreateSerializer,
    WishSerializer,
    GuestSerializer,
)


def _owner_or_error(request, slug):
    """Return (invitation, None) if the requester owns the invitation, else (None, error_response)."""
    try:
        invitation = Invitation.objects.get(slug=slug)
    except Invitation.DoesNotExist:
        return None, Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
    if invitation.couple_user != request.user and not request.user.is_staff:
        return None, Response({'detail': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)
    return invitation, None


def _get_invitation_or_error(slug):
    try:
        invitation = Invitation.objects.get(slug=slug)
    except Invitation.DoesNotExist:
        return None, Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

    if not invitation.is_active:
        return None, Response({'detail': 'Undangan belum aktif.'}, status=status.HTTP_403_FORBIDDEN)

    if date.today() > invitation.expires_at:
        return None, Response({'detail': 'Undangan telah berakhir.'}, status=status.HTTP_403_FORBIDDEN)

    return invitation, None


def is_public(invitation):
    """Live and not past its expiry: guests may see it."""
    return invitation.is_active and date.today() <= invitation.expires_at


def _public_or_404(slug, user=None):
    """Invitation for guest-facing endpoints. Drafts and expired invitations
    look exactly like missing ones (404), except to their owner or staff, so
    the editor's live preview still works."""
    invitation = Invitation.objects.filter(slug=slug).first()
    if invitation and (is_public(invitation) or (
        user is not None and user.is_authenticated
        and (user.is_staff or invitation.couple_user_id == user.id)
    )):
        return invitation, None
    return None, Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)


class WishesPagination(PageNumberPagination):
    page_size = 20


class InvitationDetailView(generics.RetrieveAPIView):
    serializer_class = InvitationPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def retrieve(self, request, slug=None, *args, **kwargs):
        invitation, error = _get_invitation_or_error(slug)
        if error:
            return error
        serializer = self.get_serializer(invitation, context={'request': request})
        return Response(serializer.data)


class RSVPCreateView(generics.CreateAPIView):
    serializer_class = RSVPCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, slug=None, *args, **kwargs):
        # Guests can only post to public invitations; no owner exception here.
        invitation, error = _public_or_404(slug)
        if error:
            return error

        ip = client_ip(request)
        cache_key = f'rsvp_ip_{ip}_{slug}'
        count = cache.get(cache_key, 0)
        if count >= 5:
            return Response(
                {'detail': 'Terlalu banyak percobaan. Coba lagi dalam 1 jam.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Link to a pre-registered guest if they came via a personal link (?g=code).
        guest = None
        guest_code = (request.data.get('guest_code') or '').strip()
        if guest_code:
            guest = Guest.objects.filter(invitation=invitation, code=guest_code).first()

        limit = (guest.max_pax if guest else None) or MAX_PAX
        if data['attending'] and data.get('pax', 1) > limit:
            return Response({'pax': [f'Undangan ini untuk {limit} orang.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                rsvp, updated = self._upsert(invitation, guest, data)
        except IntegrityError:   # a concurrent first answer won the race; update it instead
            with transaction.atomic():
                rsvp, updated = self._upsert(invitation, guest, data)

        # add() + incr() is atomic in Redis, so concurrent posts can't both slip under the limit.
        cache.add(cache_key, 0, timeout=3600)
        cache.incr(cache_key)
        body = {**RSVPCreateSerializer(rsvp).data, 'updated': updated, 'wish_status': rsvp.wish_status}
        return Response(body, status=status.HTTP_200_OK if updated else status.HTTP_201_CREATED)

    @staticmethod
    def _upsert(invitation, guest, data):
        """One answer per guest: by guest code, else by WhatsApp number."""
        rows = RSVP.objects.select_for_update().filter(invitation=invitation)
        if guest:
            existing = rows.filter(guest=guest).first()
        else:
            norm = normalise_whatsapp(data.get('whatsapp', ''))
            existing = rows.filter(guest__isnull=True, whatsapp_norm=norm).first() if norm else None
        wishes = data.get('wishes', '')
        if existing:
            if not wishes.strip():
                # A guest re-answering (e.g. now not attending) usually leaves the
                # wish box empty; that keeps the earlier wish rather than erasing it.
                data = {k: v for k, v in data.items() if k != 'wishes'}
            elif wishes != existing.wishes:   # unchanged text keeps its moderation state
                existing.wish_status = moderation.status_for(invitation, wishes)
            for field, value in data.items():
                setattr(existing, field, value)
            existing.save()
            return existing, True
        rsvp = RSVP.objects.create(invitation=invitation, guest=guest, wish_status=moderation.status_for(invitation, wishes), **data)
        return rsvp, False


class PublicGuestView(APIView):
    """What the RSVP form needs from a personal link (?g=code): the name and
    how many people the invitation is for. Nothing else about the guest list."""
    permission_classes = [AllowAny]

    def get(self, request, slug, code):
        invitation, error = _public_or_404(slug, request.user)
        if error:
            return error
        guest = invitation.guests.filter(code=code).first()
        if not guest:
            return Response({'detail': 'Tamu tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'name': guest.name, 'max_pax': guest.max_pax or MAX_PAX})


class RSVPListView(generics.ListAPIView):
    serializer_class = RSVPSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RSVP.objects.filter(invitation__slug=self.kwargs['slug']).select_related('guest')

    def list(self, request, slug=None, *args, **kwargs):
        try:
            invitation = Invitation.objects.get(slug=slug)
        except Invitation.DoesNotExist:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        if invitation.couple_user != request.user and not request.user.is_staff:
            return Response({'detail': 'Akses ditolak.'}, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        attending = queryset.filter(attending=True)
        stats = {
            'total_hadir': attending.count(),
            'total_tidak_hadir': queryset.filter(attending=False).count(),
            'total_pax': sum(r.pax for r in attending),
            'wishes_pending': queryset.filter(wish_status='pending').exclude(wishes='').count(),
        }
        return Response({'rsvps': serializer.data, 'stats': stats})


class RSVPCsvView(APIView):
    """Owner-only spreadsheet of the answers (see csv_export.py)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        invitation, error = _owner_or_error(request, slug)
        if error:
            return error
        response = HttpResponse(csv_export.rsvps_csv(invitation), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="rsvp-{invitation.slug}.csv"'
        return response


class WishesListView(generics.ListAPIView):
    serializer_class = WishSerializer
    permission_classes = [AllowAny]
    pagination_class = WishesPagination

    def list(self, request, *args, **kwargs):
        self.invitation, error = _public_or_404(self.kwargs['slug'], request.user)
        if error:
            return error
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        return self.invitation.rsvps.exclude(wishes='').filter(wish_status='visible').order_by('-submitted_at', '-id')


class EventCalendarView(APIView):
    """One event as an .ics file (iPhone / Outlook "Simpan ke Kalender")."""
    permission_classes = [AllowAny]

    def get(self, request, slug, pk):
        invitation, error = _public_or_404(slug, request.user)
        if error:
            return error
        event = invitation.events.filter(pk=pk).first()
        if not event:
            return Response({'detail': 'Acara tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        body = ics.event_ics(event, invitation, host=request.get_host().split(':')[0], maps_url=maps.open_url(event))
        response = HttpResponse(body, content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{invitation.slug}-{event.pk}.ics"'
        return response


class MusicPresetListView(generics.ListAPIView):
    """Public list of preset background tracks for the editor."""
    serializer_class = MusicPresetSerializer
    permission_classes = [AllowAny]
    queryset = MusicPreset.objects.all()


class CouponValidateView(APIView):
    """Public: validate a promo code and return its discount."""
    permission_classes = [AllowAny]

    def get(self, request):
        code = (request.query_params.get('code') or '').strip().upper()
        coupon = Coupon.objects.filter(code=code).first()
        if not coupon or not coupon.is_valid():
            return Response({'valid': False})
        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_percent': coupon.discount_percent,
            'description': coupon.description,
        })


class GuestListCreateView(generics.ListCreateAPIView):
    """Owner-only guest list. Supports single create and bulk paste via `names`."""
    serializer_class = GuestSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, slug=None, *args, **kwargs):
        invitation, error = _owner_or_error(request, slug)
        if error:
            return error
        guests = invitation.guests.all()
        stats = {
            'total': guests.count(),
            'checked_in': guests.filter(checked_in=True).count(),
        }
        return Response({'guests': GuestSerializer(guests, many=True).data, 'stats': stats})

    def create(self, request, slug=None, *args, **kwargs):
        invitation, error = _owner_or_error(request, slug)
        if error:
            return error

        names_raw = request.data.get('names')
        if names_raw:
            if isinstance(names_raw, str):
                names = [n.strip() for n in names_raw.splitlines() if n.strip()]
            else:
                names = [str(n).strip() for n in names_raw if str(n).strip()]
            created = [Guest.objects.create(invitation=invitation, name=n) for n in names]
            return Response(GuestSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        guest = serializer.save(invitation=invitation)
        return Response(GuestSerializer(guest).data, status=status.HTTP_201_CREATED)


class GuestDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Owner-only guest edit / check-in toggle / delete. Non-owners get 404 via queryset scoping."""
    serializer_class = GuestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Guest.objects.filter(invitation__slug=self.kwargs['slug'])
        user = self.request.user
        if not user.is_staff:
            qs = qs.filter(invitation__couple_user=user)
        return qs
