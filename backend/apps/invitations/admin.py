import secrets
from django.contrib import admin
from .models import (
    Invitation, Couple, Event, Story, Photo, BankAccount, RSVP, Guest,
    CoupleProfile, ActivationRequest, Coupon,
)


class CoupleInline(admin.StackedInline):
    model = Couple
    extra = 0


class EventInline(admin.StackedInline):
    model = Event
    extra = 2


class StoryInline(admin.TabularInline):
    model = Story
    extra = 1


class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 1


class BankAccountInline(admin.TabularInline):
    model = BankAccount
    extra = 1


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['slug', 'theme', 'tier', 'is_active', 'activation_requested', 'activation_code', 'wedding_date']
    list_filter = ['is_active', 'activation_requested', 'tier', 'theme']
    list_editable = ['tier', 'is_active', 'activation_code']
    search_fields = ['slug']
    readonly_fields = ['activation_requested', 'activation_requested_at', 'created_at']
    inlines = [CoupleInline, EventInline, StoryInline, PhotoInline, BankAccountInline]
    actions = ['issue_activation_code', 'activate_invitations', 'deactivate_invitations']

    @admin.action(description='Terbitkan kode aktivasi (kirim ke pasangan)')
    def issue_activation_code(self, request, queryset):
        import secrets
        for inv in queryset:
            inv.activation_code = secrets.token_hex(3).upper()  # 6-char code, e.g. A7K2QX
            inv.save(update_fields=['activation_code'])
        self.message_user(request, f'Kode aktivasi diterbitkan untuk {queryset.count()} undangan.')

    @admin.action(description='Aktifkan undangan yang dipilih')
    def activate_invitations(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description='Nonaktifkan undangan yang dipilih')
    def deactivate_invitations(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(RSVP)
class RSVPAdmin(admin.ModelAdmin):
    list_display = ['guest_name', 'invitation', 'attending', 'pax', 'submitted_at']
    list_filter = ['invitation', 'attending']
    readonly_fields = ['guest_name', 'whatsapp', 'attending', 'pax', 'wishes', 'submitted_at']


@admin.register(ActivationRequest)
class ActivationRequestAdmin(admin.ModelAdmin):
    """Inbox of couples who requested activation but aren't live yet."""
    list_display = ['slug', 'couple_names', 'tier', 'activation_code', 'is_active', 'activation_requested_at']
    list_editable = ['tier', 'activation_code', 'is_active']
    readonly_fields = ['activation_requested_at']
    actions = ['issue_activation_code']

    def get_queryset(self, request):
        return super().get_queryset(request).filter(activation_requested=True, is_active=False)

    @admin.display(description='Mempelai')
    def couple_names(self, obj):
        try:
            c = obj.couple
        except Couple.DoesNotExist:
            return '—'
        return f"{c.bride_name} & {c.groom_name}"

    @admin.action(description='Terbitkan kode aktivasi')
    def issue_activation_code(self, request, queryset):
        for inv in queryset:
            inv.activation_code = secrets.token_hex(3).upper()
            inv.save(update_fields=['activation_code'])
        self.message_user(request, f'Kode aktivasi diterbitkan untuk {queryset.count()} undangan.')


@admin.register(CoupleProfile)
class CoupleProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'max_invitations']
    list_editable = ['max_invitations']
    search_fields = ['user__username']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_percent', 'active', 'expires_at', 'description']
    list_editable = ['discount_percent', 'active', 'expires_at']
    search_fields = ['code']


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ['name', 'invitation', 'group', 'code', 'checked_in', 'checked_in_at']
    list_filter = ['invitation', 'checked_in', 'group']
    search_fields = ['name', 'code']
    readonly_fields = ['code', 'checked_in_at', 'created_at']
