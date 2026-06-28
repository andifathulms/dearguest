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
    ]
    slug = models.SlugField(unique=True, max_length=100)
    theme = models.CharField(max_length=30, choices=THEME_CHOICES, default='javanese-dark')
    is_active = models.BooleanField(default=False)
    wedding_date = models.DateField()
    expires_at = models.DateField(null=True, blank=True)
    opening_text = models.TextField(blank=True)
    closing_text = models.TextField(blank=True)
    watermark = models.BooleanField(default=True)
    music_file = models.FileField(upload_to='music/', null=True, blank=True)
    couple_user = models.OneToOneField(
        'auth.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='invitation'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = self.wedding_date + timedelta(days=90)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.slug


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
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.bank_name} — {self.account_name}"


class RSVP(models.Model):
    invitation = models.ForeignKey(Invitation, on_delete=models.CASCADE, related_name='rsvps')
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
