import logging
import secrets
from urllib.parse import quote

from django import forms
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.core.exceptions import ValidationError
from django.template.response import TemplateResponse
from django.utils.html import format_html

from . import staff_actions, themes, vouchers
from .models import (
    Invitation, Couple, Event, Story, Photo, BankAccount, RSVP, Guest,
    CoupleProfile, ActivationRequest, Coupon, MusicPreset, FunnelEvent,
    Plan, Testimonial, Payment, AbuseReport, VoucherRedemption, Article,
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


audit_log = logging.getLogger('vowvella.audit')


def audit(model_admin, request, obj, action):
    """Record a staff action on an object: Django's admin history (LogEntry),
    a structured log line that ships off the server, and the backoffice's
    activity feed (staff_actions.record)."""
    staff_actions.record(request.user, obj, action)


class PaymentForm(forms.Form):
    """What the couple paid, asked when confirming an activation."""
    amount = forms.IntegerField(min_value=0, label='Jumlah diterima (Rp)', help_text='Per undangan, mis. 99000.')
    channel = forms.ChoiceField(choices=Payment.CHANNELS, label='Lewat')
    coupon = forms.ModelChoiceField(Coupon.objects.all(), required=False, label='Voucher')
    note = forms.CharField(max_length=200, required=False, label='Catatan')


class AuditedDeletes:
    """Deletions are already in Django's history; this also logs them."""

    def delete_model(self, request, obj):
        audit_log.info('admin delete', extra={'audit': {
            'action': 'delete', 'model': obj._meta.label, 'object_id': obj.pk, 'staff_id': request.user.pk}})
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        for obj in queryset:
            audit_log.info('admin delete', extra={'audit': {
                'action': 'delete', 'model': obj._meta.label, 'object_id': obj.pk, 'staff_id': request.user.pk}})
        super().delete_queryset(request, queryset)


@admin.register(Invitation)
class InvitationAdmin(AuditedDeletes, admin.ModelAdmin):
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
        for inv in queryset:
            inv.activation_code = secrets.token_hex(3).upper()  # 6-char code, e.g. A7K2QX
            inv.save(update_fields=['activation_code'])
            audit(self, request, inv, 'Kode aktivasi diterbitkan')
        self.message_user(request, f'Kode aktivasi diterbitkan untuk {queryset.count()} undangan.')

    @admin.action(description='Aktifkan undangan yang dipilih')
    def activate_invitations(self, request, queryset):
        for inv in queryset:
            inv.is_active = True
            inv.save(update_fields=['is_active'])
            audit(self, request, inv, 'Diaktifkan')
        self.message_user(request, f'{queryset.count()} undangan diaktifkan.')

    @admin.action(description='Nonaktifkan undangan yang dipilih')
    def deactivate_invitations(self, request, queryset):
        for inv in queryset:
            inv.is_active = False
            inv.save(update_fields=['is_active'])
            audit(self, request, inv, 'Dinonaktifkan')
        self.message_user(request, f'{queryset.count()} undangan dinonaktifkan.')


@admin.register(RSVP)
class RSVPAdmin(AuditedDeletes, admin.ModelAdmin):
    list_display = ['guest_name', 'invitation', 'attending', 'pax', 'submitted_at']
    list_filter = ['invitation', 'attending']
    readonly_fields = ['guest_name', 'whatsapp', 'attending', 'pax', 'wishes', 'submitted_at']


@admin.register(ActivationRequest)
class ActivationRequestAdmin(AuditedDeletes, admin.ModelAdmin):
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

    def has_record_payment_permission(self, request):
        return request.user.has_perm('invitations.add_payment')

    @admin.action(description='✓ Konfirmasi lunas → Premium + terbitkan kode', permissions=['record_payment'])
    def fulfill_premium(self, request, queryset):
        return self._fulfill(request, queryset, 'premium')

    @admin.action(description='✓ Konfirmasi lunas → Bisnis (2 undangan) + terbitkan kode', permissions=['record_payment'])
    def fulfill_bisnis(self, request, queryset):
        return self._fulfill(request, queryset, 'bisnis')

    def _fulfill(self, request, queryset, tier):
        """First a page asking what was paid; on submit, record the payment, set
        the tier and issue the code (staff_actions.fulfill). The backoffice
        does the same from its Aktivasi page."""
        label = dict(Invitation.TIER_CHOICES)[tier]
        form = PaymentForm(request.POST if 'apply' in request.POST else None)
        if not form.is_valid():
            return TemplateResponse(request, 'admin/invitations/activationrequest/fulfill.html', {
                **self.admin_site.each_context(request),
                'title': f'Konfirmasi lunas → {label}', 'opts': self.model._meta, 'form': form,
                'invitations': queryset, 'action': request.POST.get('action'),
                'action_checkbox_name': helpers.ACTION_CHECKBOX_NAME,
            })
        done = 0
        for inv in queryset:
            try:
                staff_actions.fulfill(inv, request.user, tier, **form.cleaned_data)
                done += 1
            except vouchers.VoucherError as exc:
                self.message_user(request, f'{inv.slug}: {exc} Tidak ada yang dicatat untuk undangan ini.', messages.ERROR)
        if done:
            self.message_user(request, f'{done} undangan disetel {label}, pembayaran dicatat, kode diterbitkan. '
                                       'Kirim kode ke pasangan via WhatsApp.')
        return None

    @admin.action(description='Terbitkan kode aktivasi saja')
    def issue_activation_code(self, request, queryset):
        for inv in queryset:
            inv.activation_code = secrets.token_hex(3).upper()
            inv.save(update_fields=['activation_code'])
            audit(self, request, inv, 'Kode aktivasi diterbitkan')
        self.message_user(request, f'Kode aktivasi diterbitkan untuk {queryset.count()} undangan.')


@admin.register(Payment)
class PaymentAdmin(AuditedDeletes, admin.ModelAdmin):
    """Payments recorded when confirming activations. Amounts are owner-only:
    the Staf group can record a payment (add) but not list or open them."""
    list_display = ['created_at', 'invitation', 'tier', 'amount', 'channel', 'coupon', 'recorded_by']
    list_filter = ['tier', 'channel']
    date_hierarchy = 'created_at'
    search_fields = ['invitation__slug']
    raw_id_fields = ['invitation']
    readonly_fields = ['recorded_by', 'created_at']

    def has_add_permission(self, request):
        return super().has_add_permission(request) and self.has_view_permission(request)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.recorded_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AbuseReport)
class AbuseReportAdmin(AuditedDeletes, admin.ModelAdmin):
    """Takedown and abuse reports (RUNBOOK.md §7). Day to day they're handled
    in the backoffice (/backoffice/laporan); this is the raw table."""
    list_display = ['created_at', 'invitation', 'reason', 'status', 'url', 'reporter', 'decided_by']
    list_filter = ['status', 'reason']
    search_fields = ['url', 'invitation__slug', 'reporter']
    raw_id_fields = ['invitation']
    readonly_fields = ['decided_by', 'decided_at', 'created_at']


@admin.register(CoupleProfile)
class CoupleProfileAdmin(AuditedDeletes, admin.ModelAdmin):
    list_display = ['user', 'whatsapp', 'max_invitations']
    list_editable = ['whatsapp', 'max_invitations']
    search_fields = ['user__username', 'whatsapp']


@admin.register(MusicPreset)
class MusicPresetAdmin(admin.ModelAdmin):
    list_display = ['title', 'order']
    list_editable = ['order']


class VoucherRedemptionInline(admin.TabularInline):
    model = VoucherRedemption
    extra = 0
    fields = ['invitation', 'status', 'tier', 'discount', 'created_at', 'redeemed_at']
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Coupon)
class CouponAdmin(AuditedDeletes, admin.ModelAdmin):
    """The raw voucher table. Day to day vouchers are made in the backoffice
    (/backoffice/voucher), which checks the rules in vouchers.py."""
    list_display = ['code', 'discount_type', 'discount_percent', 'discount_amount', 'quota', 'starts_at', 'ends_at', 'active']
    list_editable = ['active']
    list_filter = ['active', 'discount_type']
    search_fields = ['code', 'description']
    readonly_fields = ['created_by', 'created_at']
    inlines = [VoucherRedemptionInline]


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    """Landing-page pricing cards. Leave "compare at price" empty unless the plan
    really sold at that price; use the badge (e.g. "Harga perkenalan") instead."""
    list_display = ['name', 'price', 'compare_at_price', 'badge', 'is_featured', 'is_active', 'order']
    list_editable = ['price', 'compare_at_price', 'badge', 'is_featured', 'is_active', 'order']
    prepopulated_fields = {'slug': ('name',)}


class TestimonialAdminForm(forms.ModelForm):
    theme = forms.ChoiceField(required=False)

    class Meta:
        model = Testimonial
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['theme'].choices = [('', '(tanpa sampul)')] + themes.choices()


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    """Landing-page quotes. Publish real couples only, with their consent.
    Rows marked "sample" are placeholders from seed_marketing."""
    form = TestimonialAdminForm
    list_display = ['names', 'city', 'theme', 'is_published', 'is_sample', 'order']
    list_editable = ['is_published', 'order']
    list_filter = ['is_published', 'is_sample']


@admin.register(Guest)
class GuestAdmin(AuditedDeletes, admin.ModelAdmin):
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


@admin.register(Article)
class ArticleAdmin(AuditedDeletes, admin.ModelAdmin):
    """The raw blog table. Articles are written in the backoffice
    (/backoffice/artikel), which previews them as they'll appear."""
    list_display = ['title', 'category', 'status', 'published_at', 'author_name']
    list_filter = ['status', 'category']
    search_fields = ['title', 'slug']
    readonly_fields = ['created_by', 'created_at', 'updated_at']
