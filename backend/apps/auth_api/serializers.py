import re

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.invitations.models import CoupleProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Activation happens over WhatsApp, so this doubles as the recovery channel
    # for accounts registered without an email.
    whatsapp = serializers.CharField(write_only=True, max_length=20)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'whatsapp']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Username sudah digunakan.')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email sudah terdaftar.')
        return value

    def validate_whatsapp(self, value):
        digits = re.sub(r'\D', '', value or '')
        if digits.startswith('62'):
            digits = '0' + digits[2:]
        if not re.fullmatch(r'08\d{8,12}', digits):
            raise serializers.ValidationError(
                'Masukkan nomor WhatsApp yang valid, contoh: 081234567890.'
            )
        if CoupleProfile.objects.filter(whatsapp=digits).exists():
            raise serializers.ValidationError('Nomor WhatsApp sudah terdaftar.')
        return digits

    def validate_password(self, value):
        """Run Django's configured password validators, not just a length check."""
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        whatsapp = validated_data.pop('whatsapp')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        CoupleProfile.objects.update_or_create(user=user, defaults={'whatsapp': whatsapp})
        return user


class FlexibleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Let couples sign in with their username, email or WhatsApp number.

    They pick a username once at registration and rarely remember which one it
    was; the number they gave us is the thing they know by heart. The identifier
    is resolved to a username before the parent serializer authenticates, so
    password checking and token issuing are untouched.
    """

    def validate(self, attrs):
        ident = (attrs.get(self.username_field) or '').strip()
        attrs[self.username_field] = _resolve_username(ident)
        return super().validate(attrs)


def _resolve_username(ident):
    """Map an email or phone number to its username; pass anything else through."""
    if not ident or User.objects.filter(username__iexact=ident).exists():
        return ident

    if '@' in ident:
        match = User.objects.filter(email__iexact=ident).first()
        return match.username if match else ident

    digits = re.sub(r'\D', '', ident)
    if digits.startswith('62'):
        digits = '0' + digits[2:]
    if digits.startswith('08'):
        profile = CoupleProfile.objects.filter(whatsapp=digits).select_related('user').first()
        if profile:
            return profile.user.username
    return ident
