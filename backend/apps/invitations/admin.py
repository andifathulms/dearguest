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
    list_display = ['slug', 'theme', 'is_active', 'wedding_date', 'expires_at', 'watermark']
    list_filter = ['theme', 'is_active', 'watermark']
    list_editable = ['is_active']
    search_fields = ['slug']
    inlines = [CoupleInline, EventInline, StoryInline, PhotoInline, BankAccountInline]
    actions = ['activate_invitations', 'deactivate_invitations']

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
