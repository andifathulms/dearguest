"""Gift confirmations ("Saya sudah kirim hadiah").

Guests say who sent what through which account, so the couple can match
transfers to names and thank people. Guests post only to public invitations
that have the form switched on; the couple reads, marks thanked and deletes."""
from django.core.cache import cache
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .editor_views import _OwnInvitationOnly, _owned
from .models import GiftConfirmation, find_guest
from .throttling import client_ip
from .views import _public_or_404

POSTS_PER_IP_PER_HOUR = 5
MAX_AMOUNT = 10_000_000_000   # Rp10 miliar: anything above is a typo


class GiftConfirmCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftConfirmation
        fields = ['sender_name', 'channel', 'amount', 'note']

    def validate_sender_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Nama wajib diisi.')
        return value

    def validate_amount(self, value):
        if value is not None and not 1 <= value <= MAX_AMOUNT:
            raise serializers.ValidationError('Nominal tidak valid.')
        return value


class OwnerGiftSerializer(serializers.ModelSerializer):
    guest_code = serializers.CharField(source='guest.code', default='', read_only=True)
    guest_group = serializers.CharField(source='guest.group', default='', read_only=True)
    guest_whatsapp = serializers.CharField(source='guest.whatsapp', default='', read_only=True)
    thanked = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = GiftConfirmation
        fields = ['id', 'sender_name', 'channel', 'amount', 'note', 'created_at', 'thanked_at', 'thanked',
                  'guest_code', 'guest_group', 'guest_whatsapp']
        read_only_fields = ['sender_name', 'channel', 'amount', 'note', 'created_at', 'thanked_at']

    def update(self, instance, validated_data):
        if 'thanked' in validated_data:
            thanked = validated_data['thanked']
            if thanked and not instance.thanked_at:
                instance.thanked_at = timezone.now()
            elif not thanked:
                instance.thanked_at = None
            instance.save(update_fields=['thanked_at'])
        return instance


class GiftConfirmCreateView(APIView):
    """POST {sender_name, channel?, amount?, note?, guest_code?}."""
    permission_classes = [AllowAny]

    def post(self, request, slug):
        invitation, error = _public_or_404(slug)
        if error:
            return error
        if not invitation.gift_confirm:
            return Response({'detail': 'Konfirmasi hadiah tidak tersedia.'}, status=status.HTTP_404_NOT_FOUND)

        key = f'gift_ip_{client_ip(request)}_{slug}'
        if cache.get(key, 0) >= POSTS_PER_IP_PER_HOUR:
            return Response({'detail': 'Terlalu banyak percobaan. Coba lagi dalam 1 jam.'},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = GiftConfirmCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        guest = find_guest(invitation, str(request.data.get('guest_code') or ''))
        serializer.save(invitation=invitation, guest=guest)

        cache.add(key, 0, timeout=3600)
        cache.incr(key)
        return Response({'ok': True}, status=status.HTTP_201_CREATED)


class MyGiftList(_OwnInvitationOnly, generics.ListAPIView):
    """Every confirmation, newest first, with a summary for the tab header."""
    serializer_class = OwnerGiftSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return _owned(self.request.user, self.kwargs['slug']).gift_confirmations.select_related('guest')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        totals = qs.aggregate(count=Count('id'), amount=Sum('amount'))
        return Response({
            'gifts': self.get_serializer(qs, many=True).data,
            'stats': {
                'count': totals['count'],
                'amount': totals['amount'] or 0,
                'unthanked': qs.filter(thanked_at__isnull=True).count(),
            },
        })


class MyGiftDetail(_OwnInvitationOnly, generics.UpdateAPIView, generics.DestroyAPIView):
    """PATCH {thanked: bool}; DELETE removes a confirmation (spam, duplicate)."""
    serializer_class = OwnerGiftSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['patch', 'delete']

    def get_queryset(self):
        return _owned(self.request.user, self.kwargs['slug']).gift_confirmations.all()
