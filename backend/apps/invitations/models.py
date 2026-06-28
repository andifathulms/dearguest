import secrets
from django.db import models
from datetime import timedelta


def generate_guest_code():
    """Short, URL-safe, unique code used in per-guest links and QR codes."""
    return secrets.token_hex(4)  # 8 hex chars


class Invitation(models.Model):
    THEME_CHOICES = [
        ('javanese-dark', 'Javanese Malam Emas'),
        ('floral-light', 'Taman Bunga'),
        ('modern-minimalist', 'Minimalis Putih'),
        ('luxury-emerald', 'Zamrud Mewah'),
        ('rustic-kraft', 'Rustic Kraft'),
        ('boho-terracotta', 'Senja Terakota'),
    ]
    TIER_CHOICES = [
        ('free', 'Gratis'),
        ('premium', 'Premium'),
        ('bisnis', 'Bisnis'),
    ]
    slug = models.SlugField(unique=True, max_length=100)
    tier = models.CharField(max_length=10, choices=TIER_CHOICES, default='free')  # paid tiers remove the watermark
    theme = models.CharField(max_length=30, choices=THEME_CHOICES, default='javanese-dark')
    is_active = models.BooleanField(default=False)
    wedding_date = models.DateField()
    expires_at = models.DateField(null=True, blank=True)
    opening_text = models.TextField(blank=True)
    closing_text = models.TextField(blank=True)
    dress_code = models.CharField(max_length=200, blank=True)
    watermark = models.BooleanField(default=True)
    music_file = models.FileField(upload_to='music/', null=True, blank=True)
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

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = self.wedding_date + timedelta(days=90)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.slug


class ActivationRequest(Invitation):
    """Proxy of Invitation for the admin 'pending activations' inbox."""
    class Meta:
        proxy = True
        verbose_name = 'Permintaan Aktivasi'
        verbose_name_plural = 'Permintaan Aktivasi (pending)'


class CoupleProfile(models.Model):
    """Per-account settings. max_invitations is the cap; admin bumps it to 2
    for Bisnis customers after payment (free/Premium = 1)."""
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    max_invitations = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.user.username} (maks {self.max_invitations})"


class Couple(models.Model):
    invitation = models.OneToOneField(Invitation, on_delete=models.CASCADE, related_name='couple')
    bride_name = models.CharField(max_length=200)
    bride_parents = models.CharField(max_length=300)
    bride_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bride_bio = models.TextField(blank=True)
    groom_name = models.CharField(max_length=200)
    groom_parents = models.CharField(max_length=300)
    groom_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    groom_bio = models.TextField(blank=True)

    def __str__(self):
        return f"{self.bride_name} & {self.groom_name}"


class Event(models.Model):
    EVENT_TYPES = [('akad', 'Akad Nikah'), ('resepsi', 'Resepsi')]
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES)
    datetime = models.DateTimeField()
    venue_name = models.CharField(max_length=300)
    address = models.TextField()
    gmaps_url = models.URLField(blank=True)
    gmaps_embed_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.invitation.slug} — {self.get_event_type_display()}"


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
    image = models.ImageField(upload_to='gallery/')
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
    qris_image = models.ImageField(upload_to='qris/', null=True, blank=True)  # scannable QRIS image
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.bank_name} — {self.account_name}"


class RSVP(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='rsvps')
    guest = models.ForeignKey('Guest', on_delete=models.SET_NULL, null=True, blank=True, related_name='rsvps')
    guest_name = models.CharField(max_length=200)
    whatsapp = models.CharField(max_length=20, blank=True)
    attending = models.BooleanField()
    pax = models.PositiveIntegerField(default=1)
    wishes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.guest_name} — {self.invitation.slug}"


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


class Guest(models.Model):
    """Pre-registered guest list for per-guest invitation links, QR codes, and check-in."""
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='guests')
    name = models.CharField(max_length=200)
    whatsapp = models.CharField(max_length=20, blank=True)
    group = models.CharField(max_length=100, blank=True)  # e.g. Keluarga, Teman Kantor
    code = models.CharField(max_length=12, unique=True, blank=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.code:
            code = generate_guest_code()
            while Guest.objects.filter(code=code).exists():
                code = generate_guest_code()
            self.code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} — {self.invitation.slug}"
