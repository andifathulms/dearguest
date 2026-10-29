from django.conf import settings
from apps.invitations import funnel
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from .cookies import REFRESH_COOKIE, clear_session, set_session
from .serializers import RegisterSerializer, FlexibleTokenObtainPairSerializer


class ThrottledLoginView(APIView):
    """Login with abuse throttling; accepts username, email or WhatsApp number.
    The tokens go into httpOnly cookies, never into the response body."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = 'login'

    def post(self, request):
        serializer = FlexibleTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data
        response = Response({'username': serializer.user.username})
        return set_session(request, response, tokens['access'], tokens['refresh'])


class CookieRefreshView(APIView):
    """New access token (and, with rotation, a new refresh token) from the
    dg_refresh cookie. The old refresh token is blacklisted."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = TokenRefreshSerializer(data={'refresh': request.COOKIES.get(REFRESH_COOKIE, '')})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:   # missing, expired, blacklisted or tampered
            return clear_session(Response({'detail': 'Sesi berakhir. Silakan masuk lagi.'},
                                          status=status.HTTP_401_UNAUTHORIZED))
        data = serializer.validated_data
        return set_session(request, Response(status=status.HTTP_204_NO_CONTENT), data['access'], data.get('refresh'))


class LogoutView(APIView):
    """Blacklist the refresh token and clear the cookies."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw = request.COOKIES.get(REFRESH_COOKIE)
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except TokenError:
                pass
        return clear_session(Response(status=status.HTTP_204_NO_CONTENT))


def revoke_sessions(user):
    """Blacklist every refresh token the user holds (password reset, account
    changes). Access tokens still run out within their 15 minutes."""
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


class RegisterView(generics.CreateAPIView):
    """Public self-registration. Returns JWT tokens so the user is logged in immediately."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        funnel.record('register', funnel.clean_utm(request.data))
        refresh = RefreshToken.for_user(user)
        response = Response({'username': user.username}, status=status.HTTP_201_CREATED)
        return set_session(request, response, refresh.access_token, refresh)


class MeView(APIView):
    """Current user + their invitation slug (used to route into the dashboard/editor)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        invitations = list(user.invitations.order_by('-created_at').values('slug', 'is_active'))
        get_token(request)   # make sure the client has a CSRF cookie
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
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if not user or not default_token_generator.check_token(user, token):
            return Response({'detail': 'Tautan reset tidak valid atau sudah kedaluwarsa.'}, status=status.HTTP_400_BAD_REQUEST)
        # Same validators as registration (length, common, numeric, similarity).
        try:
            validate_password(password, user)
        except DjangoValidationError as exc:
            return Response({'detail': ' '.join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        revoke_sessions(user)
        return Response({'detail': 'Kata sandi berhasil diperbarui. Silakan masuk.'})
