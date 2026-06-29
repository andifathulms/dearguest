from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer


class ThrottledLoginView(TokenObtainPairView):
    """Login with abuse throttling."""
    throttle_scope = 'login'


class RegisterView(generics.CreateAPIView):
    """Public self-registration. Returns JWT tokens so the user is logged in immediately."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = 'register'

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
        invitations = list(user.invitations.order_by('-created_at').values('slug', 'is_active'))
        return Response({
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'invitations': invitations,
            # First slug for convenience / backward compatibility.
            'invitation_slug': invitations[0]['slug'] if invitations else None,
        })


class PasswordResetView(APIView):
    """Send a password-reset link by email. Always 200 (don't leak account existence)."""
    permission_classes = [AllowAny]
    throttle_scope = 'password_reset'

    def post(self, request):
        ident = (request.data.get('username_or_email') or '').strip()
        user = None
        if ident:
            user = User.objects.filter(username__iexact=ident).first() or User.objects.filter(email__iexact=ident).first()
        if user and user.email:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                'Reset Kata Sandi — Dear Guest',
                f"Halo {user.username},\n\nKlik tautan berikut untuk mengatur ulang kata sandi kamu:\n{link}\n\n"
                f"Jika kamu tidak meminta ini, abaikan saja email ini.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
        return Response({'detail': 'Jika akun dengan email tersebut ada, tautan reset telah dikirim.'})


class PasswordResetConfirmView(APIView):
    """Set a new password given a valid uid+token."""
    permission_classes = [AllowAny]
    throttle_scope = 'password_reset'

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password') or ''
        if len(password) < 6:
            return Response({'detail': 'Kata sandi minimal 6 karakter.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if not user or not default_token_generator.check_token(user, token):
            return Response({'detail': 'Tautan reset tidak valid atau sudah kedaluwarsa.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        return Response({'detail': 'Kata sandi berhasil diperbarui. Silakan masuk.'})
