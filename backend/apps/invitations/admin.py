import secrets
from urllib.parse import quote

from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.utils.html import format_html

from . import themes
from .models import (
    Invitation, Couple, Event, Story, Photo, BankAccount, RSVP, Guest,
    CoupleProfile, ActivationRequest, Coupon, MusicPreset, FunnelEvent,
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


class InvitationAdminForm(forms.ModelForm):
    """Theme is a registry dropdown; like the editor, only active themes can be newly
    chosen, while an invitation already on a hidden theme can keep it."""
    theme = forms.ChoiceField(choices=())

    class Meta:
        model = Invitation
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['theme'].choices = themes.choices()

    def clean_theme(self):
        value = self.cleaned_data['theme']
        current = self.instance.theme if self.instance.pk else None
        try:
            return themes.validate_theme_choice(value, current=current)
        except ValidationError as exc:
            raise forms.ValidationError(exc.messages)


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    form = InvitationAdminForm
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
    form = InvitationAdminForm
    list_display = ['slug', 'couple_names', 'whatsapp_link', 'tier', 'activation_code', 'is_active', 'activation_requested_at']
    list_editable = ['tier', 'activation_code', 'is_active']
    readonly_fields = ['activation_requested_at']
    actions = ['fulfill_premium', 'fulfill_bisnis', 'issue_activation_code']

    def get_queryset(self, request):
        return super().get_queryset(request).filter(activation_requested=True, is_active=False)

    @admin.display(description='WhatsApp')
    def whatsapp_link(self, obj):
        """One-click chat to send the activation code — the code is never sent
        automatically, so the admin always does this by hand."""
        profile = getattr(obj.couple_user, 'profile', None) if obj.couple_user else None
        if not profile or not profile.whatsapp:
            return '—'
        text = (
            f'Halo, pembayaran untuk undangan "{obj.slug}" sudah kami terima. '
            f'Kode aktivasi kamu: {obj.activation_code or "(terbitkan dulu)"}. '
            f'Masukkan di editor lalu klik Aktifkan. Terima kasih!'
        )
        return format_html(
            '<a href="https://wa.me/{}?text={}" target="_blank" rel="noopener">{}</a>',
            profile.whatsapp_intl, quote(text), profile.whatsapp,
        )

    @admin.display(description='Mempelai')
    def couple_names(self, obj):
        try:
            c = obj.couple
        except Couple.DoesNotExist:
            return '—'
        return f"{c.bride_name} & {c.groom_name}"

    def _issue(self, inv):
        inv.activation_code = secrets.token_hex(3).upper()
        inv.save(update_fields=['tier', 'activation_code'])

    @admin.action(description='✓ Konfirmasi lunas → Premium + terbitkan kode')
    def fulfill_premium(self, request, queryset):
        for inv in queryset:
            inv.tier = 'premium'
            self._issue(inv)
        self.message_user(request, f'{queryset.count()} undangan disetel Premium + kode diterbitkan. Kirim kode ke pasangan via WhatsApp.')

    @admin.action(description='✓ Konfirmasi lunas → Bisnis (2 undangan) + terbitkan kode')
    def fulfill_bisnis(self, request, queryset):
        for inv in queryset:
            inv.tier = 'bisnis'
            self._issue(inv)
            if inv.couple_user:
                profile, _ = CoupleProfile.objects.get_or_create(user=inv.couple_user)
                if profile.max_invitations < 2:
                    profile.max_invitations = 2
                    profile.save(update_fields=['max_invitations'])
        self.message_user(request, f'{queryset.count()} undangan disetel Bisnis (2 undangan) + kode diterbitkan.')

    @admin.action(description='Terbitkan kode aktivasi saja')
    def issue_activation_code(self, request, queryset):
        for inv in queryset:
            inv.activation_code = secrets.token_hex(3).upper()
            inv.save(update_fields=['activation_code'])
        self.message_user(request, f'Kode aktivasi diterbitkan untuk {queryset.count()} undangan.')


@admin.register(CoupleProfile)
class CoupleProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'whatsapp', 'max_invitations']
    list_editable = ['whatsapp', 'max_invitations']
    search_fields = ['user__username', 'whatsapp']


@admin.register(MusicPreset)
class MusicPresetAdmin(admin.ModelAdmin):
    list_display = ['title', 'order']
    list_editable = ['order']


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


@admin.register(FunnelEvent)
class FunnelEventAdmin(admin.ModelAdmin):
    """Weekly funnel: rows are weeks, columns are steps, optionally for one
    traffic source (?source=). Read-only: events come from the site."""
    change_list_template = 'admin/invitations/funnelevent/change_list.html'
    list_display = ['week', 'step', 'utm_source', 'utm_medium', 'utm_campaign', 'created_at']
    list_filter = ['step', 'utm_source']
    WEEKS = 12

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        from datetime import timedelta
        from django.db.models import Count
        from django.utils import timezone

        today = timezone.localdate()
        monday = today - timedelta(days=today.weekday())
        weeks = [monday - timedelta(weeks=i) for i in range(self.WEEKS)]
        source = request.GET.get('source', '')
        qs = FunnelEvent.objects.filter(week__gte=weeks[-1])
        if source:
            qs = qs.filter(utm_source='' if source == '(langsung)' else source)
        counts = {(r['week'], r['step']): r['n'] for r in qs.values('week', 'step').annotate(n=Count('id'))}
        steps = FunnelEvent.STEPS
        rows = [(w, [counts.get((w, key), 0) for key, _ in steps]) for w in weeks]
        sources = sorted({s or '(langsung)' for s in FunnelEvent.objects.values_list('utm_source', flat=True).distinct()})
        context = {'funnel_steps': [label for _, label in steps], 'funnel_rows': rows,
                   'funnel_sources': sources, 'funnel_source': source}
        return super().changelist_view(request, extra_context={**context, **(extra_context or {})})
