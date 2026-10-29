import re
import secrets
from django.core.exceptions import ValidationError
from django.db import models
from datetime import timedelta

from .copy import DEFAULT_VARIANT, validate_variant
from .themes import DEFAULT_THEME, validate_registered_theme
from .uploads import SafeFileField, SafeImageField, validate_audio_upload, validate_image_upload


# An invitation stays reachable this long after the wedding.
EXPIRY_DAYS_AFTER_WEDDING = 90


# Guest codes go into links people read aloud, type and scan: no 0/O, 1/l/I.
GUEST_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
GUEST_CODE_LENGTH = 6   # 31^6 ~ 887 million per invitation


def generate_guest_code():
    """Short code for /<slug>/<code> links and QR codes. Unique per invitation
    (Guest.save retries on a clash); not derived from anything guessable."""
    return ''.join(secrets.choice(GUEST_CODE_ALPHABET) for _ in range(GUEST_CODE_LENGTH))


def find_guest(invitation, code):
    """The invitation's guest with this code, or None. New codes are upper
    case; links are often retyped in lower case, and codes made before
    October 2026 are lower-case hex, so try the code as given, then upper."""
    code = (code or '').strip()
    if not code or len(code) > 12:
        return None
    guests = invitation.guests
    return guests.filter(code=code).first() or guests.filter(code=code.upper()).first()


class Invitation(models.Model):
    # Photo treatment a pack can offer (theme.json → photoFilters); applied to
    # every couple photo on the invitation.
    PHOTO_FILTER_CHOICES = [
        ('none', 'Asli'),
        ('soft-warm', 'Hangat lembut'),
        ('bw', 'Hitam putih'),
    ]
    # Scripture block: the variant's default verse, the couple's own, or none.
    SCRIPTURE_MODES = [
        ('default', 'Ayat bawaan'),
        ('custom', 'Ayat pilihan sendiri'),
        ('none', 'Tanpa ayat'),
    ]
    TIER_CHOICES = [
        ('free', 'Gratis'),
        ('premium', 'Premium'),
        ('bisnis', 'Bisnis'),
    ]
    slug = models.SlugField(unique=True, max_length=100)
    tier = models.CharField(max_length=10, choices=TIER_CHOICES, default='free')  # paid tiers remove the watermark
    # Ids come from the theme registry (shared/themes.json), not field choices, so
    # adding or retiring a theme needs no migration.
    theme = models.CharField(max_length=30, default=DEFAULT_THEME, validators=[validate_registered_theme])
    is_active = models.BooleanField(default=False)
    wedding_date = models.DateField()
    expires_at = models.DateField(null=True, blank=True)
    opening_text = models.TextField(blank=True)
    closing_text = models.TextField(blank=True)
    dress_code = models.CharField(max_length=200, blank=True)
    photo_filter = models.CharField(max_length=12, choices=PHOTO_FILTER_CHOICES, default='none')
    # Copy variant (shared/copy/copy.json: islam, kristen, katolik, umum, ...). Ids
    # are data, like themes, so a new variant needs no migration.
    copy_variant = models.CharField(max_length=20, default=DEFAULT_VARIANT, validators=[validate_variant])
    scripture_mode = models.CharField(max_length=10, choices=SCRIPTURE_MODES, default='default')
    scripture_ref = models.CharField(max_length=120, blank=True)
    scripture_text = models.TextField(blank=True)
    # Optional address for physical gifts (shown publicly).
    gift_recipient = models.CharField(max_length=200, blank=True)
    gift_address = models.TextField(blank=True)
    gift_phone = models.CharField(max_length=20, blank=True)
    # Wish moderation: hold every wish for approval, and/or hold those matching a term.
    wishes_require_approval = models.BooleanField(default=False)
    wish_blocklist = models.TextField(blank=True, help_text='Satu kata/frasa per baris.')
    # The couple's own WhatsApp messages: {"active": "formal"|"casual", "formal",
    # "casual", "group"}. A missing key means the copy variant's default
    # (blast.* in shared/copy/copy.json), so defaults can improve later.
    wa_templates = models.JSONField(default=dict, blank=True)
    hero_photo = SafeImageField(upload_to='hero/', validators=[validate_image_upload], null=True, blank=True)  # full-bleed hero background
    watermark = models.BooleanField(default=True)
    music_file = SafeFileField(upload_to='music/', validators=[validate_audio_upload], null=True, blank=True)
    music_preset = models.ForeignKey('MusicPreset', null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    livestream_url = models.URLField(blank=True)  # YouTube/Instagram/Zoom link for remote guests
    wishlist_url = models.URLField(blank=True)  # gift registry / wishlist link
    # Manual activation (no payment gateway): admin issues activation_code after
    # confirming payment; the couple enters it in the editor to go live.
    activation_code = models.CharField(max_length=20, blank=True)
    activation_requested = models.BooleanField(default=False)
    activation_requested_at = models.DateTimeField(null=True, blank=True)
    couple_user = models.ForeignKey(
        'auth.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def from_db(cls, db, field_names, values):
        inv = super().from_db(db, field_names, values)
        inv._loaded_wedding_date = inv.wedding_date  # to spot date changes in save()
        return inv

    def save(self, *args, **kwargs):
        date_changed = self.wedding_date != getattr(self, '_loaded_wedding_date', self.wedding_date)
        if not self.expires_at or date_changed:
            self.expires_at = self.wedding_date + timedelta(days=EXPIRY_DAYS_AFTER_WEDDING)
        # A hand-set expiry may be extended, but never end before the wedding.
        self.expires_at = max(self.expires_at, self.wedding_date + timedelta(days=1))

        update_fields = kwargs.get('update_fields')
        if update_fields is not None and 'wedding_date' in update_fields:
            kwargs['update_fields'] = {*update_fields, 'expires_at'}
        super().save(*args, **kwargs)
        self._loaded_wedding_date = self.wedding_date

    def __str__(self):
        return self.slug


class ActivationRequest(Invitation):
    """Proxy of Invitation for the admin 'pending activations' inbox."""
    class Meta:
        proxy = True
        verbose_name = 'Permintaan Aktivasi'
        verbose_name_plural = 'Permintaan Aktivasi (pending)'


class ProcessedImage(models.Model):
    """Renditions of one stored image (images.py), keyed by its storage name.
    `variants` maps a width ("480") to the WebP rendition's storage name."""
    name = models.CharField(max_length=255, primary_key=True)
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    variants = models.JSONField(default=dict)
    processed_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


INSTAGRAM_RE = re.compile(r'^[A-Za-z0-9._]{1,30}$')


def validate_instagram(value):
    """Handle only, without '@' or a URL (the serializer strips both)."""
    if value and not INSTAGRAM_RE.match(value):
        raise ValidationError('Username Instagram hanya boleh huruf, angka, titik dan garis bawah.')


class CoupleProfile(models.Model):
    """Per-account settings. max_invitations is the cap; admin bumps it to 2
    for Bisnis customers after payment (free/Premium = 1).

    whatsapp is the couple's own number — activation runs over WhatsApp, so the
    admin needs a way to reach them without waiting to be messaged first."""
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    max_invitations = models.PositiveIntegerField(default=1)
    whatsapp = models.CharField(max_length=20, blank=True)

    @property
    def whatsapp_intl(self):
        """Digits in wa.me form: 08xx -> 628xx, +62 / spaces / dashes stripped."""
        num = re.sub(r'\D', '', self.whatsapp or '')
        if num.startswith('0'):
            num = '62' + num[1:]
        return num

    def __str__(self):
        return f"{self.user.username} (maks {self.max_invitations})"


class Couple(models.Model):
    invitation = models.OneToOneField(Invitation, on_delete=models.CASCADE, related_name='couple')
    bride_name = models.CharField(max_length=200)
    bride_parents = models.CharField(max_length=300, blank=True)
    bride_photo = SafeImageField(upload_to='profiles/', validators=[validate_image_upload], null=True, blank=True)
    bride_bio = models.TextField(blank=True)
    groom_name = models.CharField(max_length=200)
    groom_parents = models.CharField(max_length=300, blank=True)
    groom_photo = SafeImageField(upload_to='profiles/', validators=[validate_image_upload], null=True, blank=True)
    groom_bio = models.TextField(blank=True)

    # Structured family details. `*_parents` stays as the free-text fallback
    # for rows that couldn't be split (and for anyone who prefers one line).
    bride_child_order = models.CharField(max_length=30, blank=True, help_text='mis. pertama, kedua, bungsu')
    bride_father = models.CharField(max_length=150, blank=True)
    bride_father_deceased = models.BooleanField(default=False)
    bride_mother = models.CharField(max_length=150, blank=True)
    bride_mother_deceased = models.BooleanField(default=False)
    bride_instagram = models.CharField(max_length=30, blank=True, validators=[validate_instagram])
    groom_child_order = models.CharField(max_length=30, blank=True, help_text='mis. pertama, kedua, bungsu')
    groom_father = models.CharField(max_length=150, blank=True)
    groom_father_deceased = models.BooleanField(default=False)
    groom_mother = models.CharField(max_length=150, blank=True)
    groom_mother_deceased = models.BooleanField(default=False)
    groom_instagram = models.CharField(max_length=30, blank=True, validators=[validate_instagram])

    def __str__(self):
        return f"{self.bride_name} & {self.groom_name}"


class Event(models.Model):
    EVENT_TYPES = [
        ('akad', 'Akad Nikah'),
        ('pemberkatan', 'Pemberkatan Nikah'),
        ('sakramen', 'Sakramen Perkawinan'),
        ('resepsi', 'Resepsi'),
        ('adat', 'Upacara Adat'),
        ('ngunduh_mantu', 'Ngunduh Mantu'),
        ('lainnya', 'Lainnya'),
    ]
    # Indonesia's three time zones. Times are stored aware (UTC) and shown in
    # the event's own zone, labelled WIB / WITA / WIT.
    TIMEZONES = [
        ('Asia/Jakarta', 'WIB'),
        ('Asia/Makassar', 'WITA'),
        ('Asia/Jayapura', 'WIT'),
    ]
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    title = models.CharField(max_length=120, blank=True, help_text='Nama sendiri, mis. "Mappacci" atau "Siraman".')
    start = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=40, choices=TIMEZONES, default='Asia/Jakarta')
    venue_name = models.CharField(max_length=300)
    address = models.TextField()
    maps_link = models.CharField(max_length=500, blank=True)  # as pasted: a Google Maps link or "lat, lng"
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    dress_code = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)  # the countdown's target; exactly one per invitation (API-enforced)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'start']
        constraints = [
            models.UniqueConstraint(
                fields=['invitation'], condition=models.Q(is_primary=True), name='one_primary_event_per_invitation',
            ),
        ]

    def __str__(self):
        return f"{self.invitation.slug} — {self.title or self.get_event_type_display()}"

class Story(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='stories')
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.invitation.slug} — {self.title}"


class Photo(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='photos')
    image = SafeImageField(upload_to='gallery/', validators=[validate_image_upload])
    caption = models.CharField(max_length=300, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.invitation.slug} — photo {self.order}"


class BankAccount(models.Model):
    ACCOUNT_TYPES = [
        ('bank', 'Bank'),
        ('ewallet', 'E-Wallet'),
        ('qris', 'QRIS'),
    ]
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='bank_accounts')
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES, default='bank')
    bank_name = models.CharField(max_length=100)  # bank name, e-wallet name (GoPay/OVO/DANA), or "QRIS"
    account_number = models.CharField(max_length=50, blank=True)  # phone for e-wallet; empty for QRIS
    account_name = models.CharField(max_length=200)
    qris_image = SafeImageField(upload_to='qris/', responsive=False, validators=[validate_image_upload], null=True, blank=True)  # scannable QRIS image
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.bank_name} — {self.account_name}"


def normalise_whatsapp(value):
    """'0812-3456 789', '+62 812…', '62812…', '812…' -> '62812…'; '' if it can't be a number."""
    digits = re.sub(r'\D', '', value or '')
    if digits.startswith('0'):
        digits = '62' + digits[1:]
    elif digits.startswith('8'):
        digits = '62' + digits
    return digits if 9 <= len(digits) <= 15 else ''


class RSVP(models.Model):
    """One answer per guest: a second submission with the same guest code (or,
    without a code, the same WhatsApp number) updates this row."""
    WISH_STATUSES = [('visible', 'Tampil'), ('pending', 'Menunggu persetujuan'), ('hidden', 'Disembunyikan')]

    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='rsvps')
    guest = models.ForeignKey('Guest', on_delete=models.SET_NULL, null=True, blank=True, related_name='rsvps')
    guest_name = models.CharField(max_length=200)
    whatsapp = models.CharField(max_length=20, blank=True)
    whatsapp_norm = models.CharField(max_length=20, blank=True, db_index=True, editable=False)
    attending = models.BooleanField()
    pax = models.PositiveIntegerField(default=1)
    wishes = models.TextField(blank=True)
    wish_status = models.CharField(max_length=10, choices=WISH_STATUSES, default='visible')
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']
        constraints = [
            models.UniqueConstraint(fields=['invitation', 'guest'], condition=models.Q(guest__isnull=False),
                                    name='one_rsvp_per_guest'),
            models.UniqueConstraint(fields=['invitation', 'whatsapp_norm'],
                                    condition=models.Q(guest__isnull=True) & ~models.Q(whatsapp_norm=''),
                                    name='one_rsvp_per_whatsapp'),
        ]

    def save(self, *args, **kwargs):
        self.whatsapp_norm = normalise_whatsapp(self.whatsapp)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.guest_name} — {self.invitation.slug}"


class MusicPreset(models.Model):
    """Royalty-free background tracks (uploaded by admin) couples can pick from."""
    title = models.CharField(max_length=120)
    audio = SafeFileField(upload_to='music_presets/', validators=[validate_audio_upload])
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class Coupon(models.Model):
    """Promo code shown on the pricing page; redeemed manually over WhatsApp."""
    code = models.CharField(max_length=30, unique=True)
    discount_percent = models.PositiveIntegerField(default=0)  # 0–100
    description = models.CharField(max_length=200, blank=True)
    active = models.BooleanField(default=True)
    expires_at = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def is_valid(self):
        from datetime import date
        if not self.active:
            return False
        if self.expires_at and date.today() > self.expires_at:
            return False
        return 1 <= self.discount_percent <= 100

    def __str__(self):
        return f"{self.code} (-{self.discount_percent}%)"


MAX_PAX = 10  # per RSVP when the guest has no own limit


class Guest(models.Model):
    """Pre-registered guest list for per-guest invitation links, QR codes, and check-in."""
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='guests')
    name = models.CharField(max_length=200)
    whatsapp = models.CharField(max_length=20, blank=True)
    group = models.CharField(max_length=100, blank=True)  # e.g. Keluarga, Teman Kantor
    # How many people this invitation is for; null means the invitation-wide limit.
    max_pax = models.PositiveSmallIntegerField(null=True, blank=True)
    # Unique per invitation (the link carries the slug). Pre-Oct-2026 codes are
    # 8 lower-case hex chars and keep working; new ones use GUEST_CODE_ALPHABET.
    code = models.CharField(max_length=12, blank=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    # Marked by the couple's send queue when they come back from WhatsApp; we
    # can't see whether WhatsApp actually delivered it.
    sent_at = models.DateTimeField(null=True, blank=True)
    # Opens of this guest's personal link (POST .../guest/<code>/open/). No IP,
    # device or location is stored; repeats within 30 minutes count once, and
    # crawlers and the couple's own visits are ignored.
    first_opened_at = models.DateTimeField(null=True, blank=True)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    open_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['invitation', 'code'], name='guest_code_unique_per_invitation'),
        ]

    def save(self, *args, **kwargs):
        if not self.code:
            code = generate_guest_code()
            while Guest.objects.filter(invitation_id=self.invitation_id, code=code).exists():
                code = generate_guest_code()
            self.code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} — {self.invitation.slug}"
