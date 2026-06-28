from django.utils import timezone
from rest_framework import serializers
from .models import Invitation, Couple, Event, Story, Photo, BankAccount, RSVP, Guest


class RSVPSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSVP
        fields = ['id', 'guest_name', 'whatsapp', 'attending', 'pax', 'wishes', 'submitted_at']
        read_only_fields = ['submitted_at']


class RSVPCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSVP
        fields = ['guest_name', 'whatsapp', 'attending', 'pax', 'wishes']

    def validate_pax(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Jumlah tamu harus antara 1 dan 10.")
        return value


class WishSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSVP
        fields = ['guest_name', 'wishes', 'submitted_at']


class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['id', 'name', 'whatsapp', 'group', 'code', 'checked_in', 'checked_in_at', 'created_at']
        read_only_fields = ['code', 'checked_in_at', 'created_at']

    def update(self, instance, validated_data):
        if 'checked_in' in validated_data:
            if validated_data['checked_in'] and not instance.checked_in:
                instance.checked_in_at = timezone.now()
            elif not validated_data['checked_in']:
                instance.checked_in_at = None
        return super().update(instance, validated_data)


class CoupleSerializer(serializers.ModelSerializer):
    bride_photo = serializers.SerializerMethodField()
    groom_photo = serializers.SerializerMethodField()

    class Meta:
        model = Couple
        fields = [
            'bride_name', 'bride_parents', 'bride_photo', 'bride_bio',
            'groom_name', 'groom_parents', 'groom_photo', 'groom_bio',
        ]

    def _build_url(self, field):
        request = self.context.get('request')
        if field and request:
            return request.build_absolute_uri(field.url)
        return None

    def get_bride_photo(self, obj):
        return self._build_url(obj.bride_photo)

    def get_groom_photo(self, obj):
        return self._build_url(obj.groom_photo)


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'event_type', 'datetime', 'venue_name', 'address', 'gmaps_url', 'gmaps_embed_url']


class StorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ['id', 'title', 'description', 'date', 'order']


class PhotoSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ['id', 'image', 'caption', 'order']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class BankAccountSerializer(serializers.ModelSerializer):
    qris_image = serializers.SerializerMethodField()

    class Meta:
        model = BankAccount
        fields = ['id', 'account_type', 'bank_name', 'account_number', 'account_name', 'qris_image', 'order']

    def get_qris_image(self, obj):
        request = self.context.get('request')
        if obj.qris_image and request:
            return request.build_absolute_uri(obj.qris_image.url)
        return None


class InvitationPublicSerializer(serializers.ModelSerializer):
    couple = CoupleSerializer(read_only=True)
    events = EventSerializer(many=True, read_only=True)
    stories = StorySerializer(many=True, read_only=True)
    photos = PhotoSerializer(many=True, read_only=True)
    bank_accounts = BankAccountSerializer(many=True, read_only=True)
    music_file = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = [
            'slug', 'theme', 'wedding_date', 'expires_at',
            'opening_text', 'closing_text', 'watermark', 'music_file',
            'livestream_url',
            'couple', 'events', 'stories', 'photos', 'bank_accounts',
        ]

    def get_music_file(self, obj):
        request = self.context.get('request')
        if obj.music_file and request:
            return request.build_absolute_uri(obj.music_file.url)
        return None


# ===== Editor (authenticated, owner-scoped, writable) serializers =====
import re


class CoupleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Couple
        fields = [
            'bride_name', 'bride_parents', 'bride_photo', 'bride_bio',
            'groom_name', 'groom_parents', 'groom_photo', 'groom_bio',
        ]


class EventWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'event_type', 'datetime', 'venue_name', 'address', 'gmaps_url', 'gmaps_embed_url']


class StoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ['id', 'title', 'description', 'date', 'order']


class PhotoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ['id', 'image', 'caption', 'order']


class BankAccountWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['id', 'account_type', 'bank_name', 'account_number', 'account_name', 'qris_image', 'order']


class InvitationSettingsSerializer(serializers.ModelSerializer):
    """Settings a couple may edit themselves. is_active and watermark stay admin-controlled (paywall)."""
    class Meta:
        model = Invitation
        fields = [
            'slug', 'theme', 'wedding_date', 'opening_text', 'closing_text',
            'music_file', 'livestream_url', 'is_active', 'watermark', 'expires_at',
        ]
        read_only_fields = ['slug', 'is_active', 'watermark', 'expires_at']


class InvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['slug', 'theme', 'wedding_date']

    def validate_slug(self, value):
        value = value.strip().lower()
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value):
            raise serializers.ValidationError('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.')
        if Invitation.objects.filter(slug=value).exists():
            raise serializers.ValidationError('Slug ini sudah digunakan. Pilih yang lain.')
        return value


class EditorInvitationSerializer(serializers.ModelSerializer):
    """Full read of the owner's invitation, including all nested editable content."""
    couple = CoupleWriteSerializer(read_only=True)
    events = EventWriteSerializer(many=True, read_only=True)
    stories = StoryWriteSerializer(many=True, read_only=True)
    photos = PhotoWriteSerializer(many=True, read_only=True)
    bank_accounts = BankAccountWriteSerializer(many=True, read_only=True)

    class Meta:
        model = Invitation
        fields = [
            'slug', 'theme', 'wedding_date', 'expires_at',
            'opening_text', 'closing_text', 'watermark', 'is_active',
            'music_file', 'livestream_url',
            'couple', 'events', 'stories', 'photos', 'bank_accounts',
        ]
