from datetime import date
from django.core.cache import cache
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework.views import APIView
from .models import Invitation, RSVP, Guest, Coupon
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

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def create(self, request, slug=None, *args, **kwargs):
        invitation, error = _get_invitation_or_error(slug)
        if error:
            return error

        ip = self._get_client_ip(request)
        cache_key = f'rsvp_ip_{ip}_{slug}'
        count = cache.get(cache_key, 0)
        if count >= 5:
            return Response(
                {'detail': 'Terlalu banyak percobaan. Coba lagi dalam 1 jam.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(invitation=invitation)

        cache.set(cache_key, count + 1, timeout=3600)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RSVPListView(generics.ListAPIView):
    serializer_class = RSVPSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RSVP.objects.filter(invitation__slug=self.kwargs['slug'])

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
        }
        return Response({'rsvps': serializer.data, 'stats': stats})


class WishesListView(generics.ListAPIView):
    serializer_class = WishSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return RSVP.objects.filter(
            invitation__slug=self.kwargs['slug'],
        ).exclude(wishes='')


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
