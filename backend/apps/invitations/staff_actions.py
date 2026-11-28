"""What staff can do to an invitation, account, wish or report, from the
backoffice (staff_views.py) or the Django admin. Each action is audited the
same way: Django's admin history (LogEntry), a structured audit log line that
ships off the server, and a 'staff_action' row in the activity feed."""
import logging
import secrets
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.admin.models import CHANGE, LogEntry
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from . import activity, vouchers
from .models import Coupon, CoupleProfile, Invitation, Payment, Plan

audit_log = logging.getLogger('vowvella.audit')
TIER_LABELS = dict(Invitation.TIER_CHOICES)


def record(user, obj, action):
    LogEntry.objects.log_actions(user.pk, [obj], CHANGE, change_message=action, single_object=True)
    invitation = obj if isinstance(obj, Invitation) else getattr(obj, 'invitation', None)
    activity.record('staff_action', invitation, user, actor='staff', action=action)
    audit_log.info('staff action', extra={'audit': {
        'action': action, 'model': obj._meta.label, 'object_id': obj.pk, 'staff_id': user.pk,
    }})


def issue_code(inv, user):
    inv.activation_code = secrets.token_hex(3).upper()   # 6 characters, e.g. A7K2QX
    inv.save(update_fields=['activation_code'])
    record(user, inv, 'Kode aktivasi diterbitkan')


@transaction.atomic
def fulfill(inv, user, tier, amount, channel='transfer', coupon=None, note=''):
    """The couple paid: record it, set the tier and issue the code staff send
    them by WhatsApp. Bisnis also allows a second invitation. With a voucher,
    it must still be usable for this plan (vouchers.VoucherError otherwise) and
    is redeemed; without one, a code the couple pasted is released."""
    if coupon:
        coupon = Coupon.objects.select_for_update().get(pk=coupon.pk)   # the quota can't be overrun
        vouchers.check(coupon, tier=tier, user=inv.couple_user, invitation=inv)
    inv.tier = tier
    inv.activation_code = secrets.token_hex(3).upper()
    inv.save(update_fields=['tier', 'activation_code'])
    payment = Payment.objects.create(invitation=inv, tier=tier, amount=amount, channel=channel, coupon=coupon,
                                     note=note, recorded_by=user)
    if coupon:
        list_price = Plan.objects.filter(slug=tier).values_list('price', flat=True).first() or 0
        vouchers.redeem(inv, coupon, payment, tier, list_price)
    else:
        vouchers.release_claim(inv)
    if tier == 'bisnis' and inv.couple_user:
        profile, _ = CoupleProfile.objects.get_or_create(user=inv.couple_user)
        if profile.max_invitations < 2:
            profile.max_invitations = 2
            profile.save(update_fields=['max_invitations'])
    record(user, inv, f'Lunas: {TIER_LABELS[tier]}, kode diterbitkan')


def set_active(inv, user, on):
    if inv.is_active != on:
        inv.is_active = on
        inv.save(update_fields=['is_active'])
        record(user, inv, 'Diaktifkan' if on else 'Dinonaktifkan')


def extend(inv, user, days=30):
    inv.expires_at = max(inv.expires_at or inv.wedding_date, timezone.localdate()) + timedelta(days=days)
    inv.save(update_fields=['expires_at'])
    record(user, inv, f'Masa aktif diperpanjang sampai {inv.expires_at:%d-%m-%Y}')


def set_watermark(inv, user, on):
    inv.watermark = on
    inv.save(update_fields=['watermark'])
    record(user, inv, 'Watermark dipasang' if on else 'Watermark dihapus')


def allow_two(couple_user, user):
    profile, _ = CoupleProfile.objects.get_or_create(user=couple_user)
    profile.max_invitations = max(profile.max_invitations, 2)
    profile.save(update_fields=['max_invitations'])
    record(user, profile, 'Batas undangan dinaikkan ke 2')


def reset_link(couple_user, user):
    """Owner only (callers check). A reset link opens the account, so it is
    shown once, for sending to the couple's own WhatsApp. It stops working once
    used or once they log in."""
    uid = urlsafe_base64_encode(force_bytes(couple_user.pk))
    link = f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={default_token_generator.make_token(couple_user)}'
    profile, _ = CoupleProfile.objects.get_or_create(user=couple_user)
    text = f'Halo, ini tautan untuk mengatur ulang kata sandi akun Vowvella kamu: {link}'
    record(user, profile, 'Tautan reset sandi dibuat')
    return {'link': link, 'whatsapp': f'https://wa.me/{profile.whatsapp_intl}?text={quote(text)}' if profile.whatsapp else None}


def set_wish(rsvp, user, status):
    rsvp.wish_status = status
    rsvp.save(update_fields=['wish_status'])
    record(user, rsvp.invitation, f'Ucapan {"disembunyikan" if status == "hidden" else "ditampilkan"} (RSVP {rsvp.pk})')


DECISIONS = {
    # decision: (report status, invitation active afterwards or None to leave it, audit text)
    'takedown': ('takedown', False, 'Laporan: undangan dinonaktifkan'),
    'no_action': ('no_action', None, 'Laporan: tidak ada tindakan'),
    'restore': ('resolved', True, 'Laporan selesai: undangan aktif lagi'),
}


@transaction.atomic
def decide_report(report, user, decision, note=''):
    status, active, text = DECISIONS[decision]
    report.status, report.decided_by, report.decided_at = status, user, timezone.now()
    if note:
        report.decision_note = note
    report.save(update_fields=['status', 'decided_by', 'decided_at', 'decision_note'])
    inv = report.invitation
    if inv and active is not None and inv.is_active != active:
        inv.is_active = active
        inv.save(update_fields=['is_active'])
    record(user, inv or report, text)
