from datetime import date
from django.core.cache import cache
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Invitation, RSVP
from .serializers import (
    InvitationPublicSerializer,
    RSVPSerializer,
    RSVPCreateSerializer,
    WishSerializer,
)


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
