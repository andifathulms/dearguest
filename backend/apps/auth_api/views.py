from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from apps.invitations.models import Invitation
from .serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    """Public self-registration. Returns JWT tokens so the user is logged in immediately."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """Current user + their invitation slug (used to route into the dashboard/editor)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            inv = user.invitation
        except Invitation.DoesNotExist:
            inv = None
        return Response({
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'invitation_slug': inv.slug if inv else None,
            'invitation_active': inv.is_active if inv else None,
        })
