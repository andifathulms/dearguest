from django.contrib import admin
from .models import Invitation, Couple, Event, Story, Photo, BankAccount, RSVP, Guest


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
    list_display = ['slug', 'theme', 'is_active', 'activation_requested', 'activation_code', 'wedding_date', 'expires_at']
    list_filter = ['is_active', 'activation_requested', 'theme', 'watermark']
    list_editable = ['is_active', 'activation_code']
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


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ['name', 'invitation', 'group', 'code', 'checked_in', 'checked_in_at']
    list_filter = ['invitation', 'checked_in', 'group']
    search_fields = ['name', 'code']
    readonly_fields = ['code', 'checked_in_at', 'created_at']
