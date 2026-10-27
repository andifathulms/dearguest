"""Authenticated, owner-scoped editor API. A couple may own several invitations;
every endpoint is scoped to {slug} and verifies the requester owns it (or is staff).
is_active/watermark/tier remain admin-controlled (the paywall)."""
import re
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import Invitation, Couple, Event, Story, Photo, BankAccount, CoupleProfile, MusicPreset
from .serializers import (
    EditorInvitationSerializer,
    InvitationListSerializer,
    InvitationSettingsSerializer,
    InvitationCreateSerializer,
    CoupleWriteSerializer,
    EventWriteSerializer,
    StoryWriteSerializer,
    PhotoWriteSerializer,
    BankAccountWriteSerializer,
)


def _owned(user, slug):
    """The invitation with this slug if the user owns it (or is staff), else None."""
    qs = Invitation.objects.filter(slug=slug)
    if not user.is_staff:
        qs = qs.filter(couple_user=user)
    return qs.first()


class MyInvitationsView(APIView):
    """GET the couple's invitations; POST to create a new draft."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = CoupleProfile.objects.get_or_create(user=request.user)
        if request.user.is_staff:
            qs = Invitation.objects.all()
            max_invitations = max(qs.count(), 1)
        else:
            qs = Invitation.objects.filter(couple_user=request.user)
            max_invitations = profile.max_invitations
        data = InvitationListSerializer(qs.order_by('-created_at'), many=True, context={'request': request}).data
        return Response({'invitations': data, 'max_invitations': max_invitations})

    def post(self, request):
        profile, _ = CoupleProfile.objects.get_or_create(user=request.user)
        if not request.user.is_staff and request.user.invitations.count() >= profile.max_invitations:
            return Response(
                {'detail': f'Batas undangan tercapai ({profile.max_invitations}). Upgrade ke paket Bisnis untuk membuat 2 undangan.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = InvitationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inv = serializer.save(couple_user=request.user, is_active=False)
        Couple.objects.get_or_create(
            invitation=inv,
            defaults={'bride_name': '', 'bride_parents': '', 'groom_name': '', 'groom_parents': ''},
        )
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data, status=status.HTTP_201_CREATED)


class MyInvitationDetailView(APIView):
    """GET full invitation, PATCH settings, DELETE the draft."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data)

    def patch(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InvitationSettingsSerializer(inv, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Uploading a custom track supersedes any chosen preset.
        if 'music_file' in request.FILES:
            inv.music_preset = None
            inv.save(update_fields=['music_preset'])
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data)

    def delete(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        # Live or paid-for invitations can only be removed by staff in the admin,
        # so a mis-click can't wipe RSVPs or an order the couple paid for.
        if inv.is_active or inv.tier != 'free':
            return Response(
                {'detail': 'Undangan yang sudah aktif atau dibayar tidak bisa dihapus. Hubungi admin.'},
                status=status.HTTP_409_CONFLICT,
            )
        inv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MusicPresetSelectView(APIView):
    """Owner picks (or clears) a preset background track."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        preset_id = request.data.get('preset_id')
        if preset_id:
            preset = MusicPreset.objects.filter(pk=preset_id).first()
            if not preset:
                return Response({'detail': 'Preset tidak ditemukan.'}, status=status.HTTP_400_BAD_REQUEST)
            inv.music_preset = preset
            inv.music_file = None  # preset and upload are mutually exclusive
        else:
            inv.music_preset = None
        inv.save(update_fields=['music_preset', 'music_file'])
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data)

    def delete(self, request, slug):
        """Remove all background music: the chosen preset and any uploaded track."""
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        inv.music_preset = None
        if inv.music_file:
            inv.music_file.delete(save=False)
        inv.music_file = None
        inv.save(update_fields=['music_preset', 'music_file'])
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data)


class RequestActivationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        if inv.is_active:
            return Response({'detail': 'Undangan sudah aktif.'}, status=status.HTTP_400_BAD_REQUEST)
        inv.activation_requested = True
        inv.activation_requested_at = timezone.now()
        inv.save(update_fields=['activation_requested', 'activation_requested_at'])
        # Notify admin so they can confirm payment and issue an activation code.
        couple = getattr(inv, 'couple', None)
        names = f"{couple.bride_name} & {couple.groom_name}" if couple else inv.slug
        profile = getattr(request.user, 'profile', None)
        wa = profile.whatsapp if profile else ''
        send_mail(
            f'[Aktivasi] Permintaan aktivasi: {inv.slug}',
            f"Undangan '{inv.slug}' ({names}) meminta aktivasi.\n\n"
            f"Akun    : {request.user.username}\n"
            f"WhatsApp: {wa or '(belum diisi)'}\n"
            f"Email   : {request.user.email or '(kosong)'}\n\n"
            f"Konfirmasi pembayaran, lalu terbitkan kode aktivasi & set tier di admin:\n"
            f"Buka admin → Permintaan Aktivasi (nomor WhatsApp bisa diklik di sana).",
            settings.DEFAULT_FROM_EMAIL,
            [settings.ADMIN_EMAIL],
            fail_silently=True,
        )
        return Response({'activation_requested': True})


class ActivateView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'activate'

    def post(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        if inv.is_active:
            return Response({'is_active': True})
        code = (request.data.get('code') or '').strip()
        if not inv.activation_code or code.upper() != inv.activation_code.strip().upper():
            return Response({'detail': 'Kode aktivasi tidak valid.'}, status=status.HTTP_400_BAD_REQUEST)
        inv.is_active = True
        inv.save(update_fields=['is_active'])
        return Response({'is_active': True})


class SlugCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        slug = (request.query_params.get('slug') or '').strip().lower()
        valid = bool(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug))
        available = valid and not Invitation.objects.filter(slug=slug).exists()
        return Response({'slug': slug, 'valid': valid, 'available': available})


class MyCoupleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        couple, _ = Couple.objects.get_or_create(invitation=inv)
        return Response(CoupleWriteSerializer(couple, context={'request': request}).data)

    def put(self, request, slug):
        inv = _owned(request.user, slug)
        if not inv:
            return Response({'detail': 'Undangan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        couple, _ = Couple.objects.get_or_create(invitation=inv)
        serializer = CoupleWriteSerializer(couple, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class _OwnedChildList(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    model = None
    related_name = None

    def _inv(self):
        return _owned(self.request.user, self.kwargs['slug'])

    def get_queryset(self):
        inv = self._inv()
        if not inv:
            return self.model.objects.none()
        return getattr(inv, self.related_name).all()

    def perform_create(self, serializer):
        inv = self._inv()
        if not inv:
            raise PermissionDenied('Undangan tidak ditemukan.')
        serializer.save(invitation=inv)


class _OwnedChildDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    model = None

    def get_queryset(self):
        inv = _owned(self.request.user, self.kwargs['slug'])
        if not inv:
            return self.model.objects.none()
        return self.model.objects.filter(invitation=inv)


class EventListCreate(_OwnedChildList):
    """Exactly one event per invitation is primary (the countdown's target):
    the first event becomes primary, and marking another demotes the old one."""
    model = Event
    related_name = 'events'
    serializer_class = EventWriteSerializer

    def perform_create(self, serializer):
        inv = self._inv()
        if not inv:
            raise PermissionDenied('Undangan tidak ditemukan.')
        with transaction.atomic():
            primary = serializer.validated_data.get('is_primary') or not inv.events.filter(is_primary=True).exists()
            if primary:
                inv.events.update(is_primary=False)
            serializer.save(invitation=inv, is_primary=primary)


class EventDetail(_OwnedChildDetail):
    model = Event
    serializer_class = EventWriteSerializer

    def perform_update(self, serializer):
        event = serializer.instance
        wants = serializer.validated_data.get('is_primary')
        with transaction.atomic():
            if wants is True:
                Event.objects.filter(invitation=event.invitation).exclude(pk=event.pk).update(is_primary=False)
            elif wants is False and event.is_primary:
                raise ValidationError({'is_primary': 'Pilih acara utama yang lain terlebih dahulu.'})
            serializer.save()

    def perform_destroy(self, instance):
        with transaction.atomic():
            inv, was_primary = instance.invitation, instance.is_primary
            instance.delete()
            if was_primary:
                successor = inv.events.order_by('order', 'start', 'id').first()
                if successor:
                    successor.is_primary = True
                    successor.save(update_fields=['is_primary'])


class StoryListCreate(_OwnedChildList):
    model = Story
    related_name = 'stories'
    serializer_class = StoryWriteSerializer


class StoryDetail(_OwnedChildDetail):
    model = Story
    serializer_class = StoryWriteSerializer


class PhotoListCreate(_OwnedChildList):
    model = Photo
    related_name = 'photos'
    serializer_class = PhotoWriteSerializer


class PhotoDetail(_OwnedChildDetail):
    model = Photo
    serializer_class = PhotoWriteSerializer


class BankAccountListCreate(_OwnedChildList):
    model = BankAccount
    related_name = 'bank_accounts'
    serializer_class = BankAccountWriteSerializer


class BankAccountDetail(_OwnedChildDetail):
    model = BankAccount
    serializer_class = BankAccountWriteSerializer
