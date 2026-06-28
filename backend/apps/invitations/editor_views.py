"""Authenticated, owner-scoped editor API. Every endpoint operates on the
invitation owned by request.user (couple_user). Couples manage their own draft;
is_active/watermark remain admin-controlled (the paywall)."""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Invitation, Couple, Event, Story, Photo, BankAccount
from .serializers import (
    EditorInvitationSerializer,
    InvitationSettingsSerializer,
    InvitationCreateSerializer,
    CoupleWriteSerializer,
    EventWriteSerializer,
    StoryWriteSerializer,
    PhotoWriteSerializer,
    BankAccountWriteSerializer,
)


def _my_invitation(user):
    try:
        return user.invitation
    except Invitation.DoesNotExist:
        return None


class MyInvitationView(APIView):
    """GET own invitation (full), POST to create one, PATCH to update settings."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inv = _my_invitation(request.user)
        if not inv:
            return Response({'detail': 'Belum ada undangan.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data)

    def post(self, request):
        if _my_invitation(request.user):
            return Response({'detail': 'Anda sudah memiliki undangan.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = InvitationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inv = serializer.save(couple_user=request.user, is_active=False)
        # Create a blank couple so the editor has something to edit immediately.
        Couple.objects.get_or_create(
            invitation=inv,
            defaults={'bride_name': '', 'bride_parents': '', 'groom_name': '', 'groom_parents': ''},
        )
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        inv = _my_invitation(request.user)
        if not inv:
            return Response({'detail': 'Belum ada undangan.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InvitationSettingsSerializer(inv, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EditorInvitationSerializer(inv, context={'request': request}).data)


class SlugCheckView(APIView):
    """GET ?slug=xyz -> {available: bool}. Used live during onboarding."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        import re
        slug = (request.query_params.get('slug') or '').strip().lower()
        valid = bool(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug))
        available = valid and not Invitation.objects.filter(slug=slug).exists()
        return Response({'slug': slug, 'valid': valid, 'available': available})


class MyCoupleView(APIView):
    """GET / PUT the owner's couple profile (multipart for photos)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inv = _my_invitation(request.user)
        if not inv:
            return Response({'detail': 'Belum ada undangan.'}, status=status.HTTP_404_NOT_FOUND)
        couple, _ = Couple.objects.get_or_create(invitation=inv)
        return Response(CoupleWriteSerializer(couple, context={'request': request}).data)

    def put(self, request):
        inv = _my_invitation(request.user)
        if not inv:
            return Response({'detail': 'Belum ada undangan.'}, status=status.HTTP_404_NOT_FOUND)
        couple, _ = Couple.objects.get_or_create(invitation=inv)
        serializer = CoupleWriteSerializer(couple, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class _OwnedChildList(generics.ListCreateAPIView):
    """List/create child rows belonging to the owner's invitation."""
    permission_classes = [IsAuthenticated]
    model = None
    related_name = None

    def get_queryset(self):
        inv = _my_invitation(self.request.user)
        if not inv:
            return self.model.objects.none()
        return getattr(inv, self.related_name).all()

    def perform_create(self, serializer):
        inv = _my_invitation(self.request.user)
        serializer.save(invitation=inv)


class _OwnedChildDetail(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve/update/delete a single child row, scoped to the owner."""
    permission_classes = [IsAuthenticated]
    model = None

    def get_queryset(self):
        inv = _my_invitation(self.request.user)
        if not inv:
            return self.model.objects.none()
        return self.model.objects.filter(invitation=inv)


class EventListCreate(_OwnedChildList):
    model = Event
    related_name = 'events'
    serializer_class = EventWriteSerializer


class EventDetail(_OwnedChildDetail):
    model = Event
    serializer_class = EventWriteSerializer


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
