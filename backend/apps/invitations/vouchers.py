"""Vouchers (the Coupon model): who may use a code, what it takes off, and its
place in the quota.

A couple pastes a code on the landing page (a preview of the price) or on
their invitation in the editor, which claims it: the claim holds one place in
the quota until staff confirm the payment (redeemed) or the code is removed
(released). Claims lock the voucher row, so two couples can't both take the
last place."""
import re
import secrets

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import GUEST_CODE_ALPHABET, Coupon, Plan, VoucherRedemption

CODE_RE = re.compile(r'^[A-Z0-9][A-Z0-9-]{2,29}$')
PAID_TIERS = ('premium', 'bisnis')


class VoucherError(Exception):
    """A code that can't be used, with the reason in Indonesian for the couple."""


def normalise(code):
    """As typed or pasted: spaces and stray punctuation gone, upper case."""
    return re.sub(r'[^A-Z0-9-]', '', str(code or '').upper())


def generate_code(prefix='VV'):
    """An unused code like VV-7KQ2MX (no 0/O, 1/I/L, so it can be read aloud)."""
    while True:
        code = f'{prefix}-' + ''.join(secrets.choice(GUEST_CODE_ALPHABET) for _ in range(6))
        if not Coupon.objects.filter(code=code).exists():
            return code


def live_uses(coupon):
    """Redemptions holding a place in the quota: paid ones, and claims by an
    invitation that still exists."""
    return coupon.redemptions.filter(Q(status='redeemed') | Q(status='claimed', invitation__isnull=False))


def used(coupon):
    return live_uses(coupon).count()


def left(coupon):
    return None if coupon.quota is None else max(0, coupon.quota - used(coupon))


def state(coupon, now=None):
    """'inactive', 'scheduled', 'ended', 'exhausted' or 'active'."""
    now = now or timezone.now()
    if not coupon.active:
        return 'inactive'
    if coupon.starts_at and now < coupon.starts_at:
        return 'scheduled'
    if coupon.ends_at and now > coupon.ends_at:
        return 'ended'
    if coupon.quota is not None and used(coupon) >= coupon.quota:
        return 'exhausted'
    return 'active'


def applies_to(coupon, tier):
    return tier in (coupon.plans or PAID_TIERS)


def discount(coupon, price):
    """Rupiah off `price`: never more than the price, and for percent vouchers
    never more than max_discount."""
    if not price:
        return 0
    if coupon.discount_type == 'amount':
        off = coupon.discount_amount
    else:
        off = price * coupon.discount_percent // 100
        if coupon.max_discount:
            off = min(off, coupon.max_discount)
    return min(off, price)


def prices(coupon=None):
    """{tier: {name, price, discount, final}} for the paid plans, with the
    voucher applied where it is allowed."""
    out = {}
    for plan in Plan.objects.filter(slug__in=PAID_TIERS, is_active=True):
        off = discount(coupon, plan.price) if coupon and applies_to(coupon, plan.slug) else 0
        out[plan.slug] = {'name': plan.name, 'price': plan.price, 'discount': off, 'final': plan.price - off}
    return out


def check(code_or_coupon, *, tier=None, user=None, invitation=None, now=None):
    """The voucher if it may be used, else VoucherError with the reason.
    `invitation`'s own claim doesn't count against it (re-checking a code it
    already holds)."""
    coupon = code_or_coupon
    if not isinstance(coupon, Coupon):
        coupon = Coupon.objects.filter(code=normalise(code_or_coupon)).first()
        if not coupon:
            raise VoucherError('Kode voucher tidak ditemukan. Periksa ejaannya.')
    now = now or timezone.now()
    if not coupon.active:
        raise VoucherError('Voucher ini sudah tidak berlaku.')
    if coupon.starts_at and now < coupon.starts_at:
        start = timezone.localtime(coupon.starts_at)
        raise VoucherError(f'Voucher ini baru berlaku mulai {start:%d-%m-%Y %H:%M} WIB.')
    if coupon.ends_at and now > coupon.ends_at:
        raise VoucherError('Masa berlaku voucher ini sudah habis.')
    mine = live_uses(coupon).filter(invitation=invitation) if invitation else VoucherRedemption.objects.none()
    if coupon.quota is not None and not mine.exists() and used(coupon) >= coupon.quota:
        raise VoucherError('Kuota voucher ini sudah habis.')
    if tier and not applies_to(coupon, tier):
        names = ', '.join(p.name for p in Plan.objects.filter(slug__in=coupon.plans)) or ', '.join(coupon.plans)
        raise VoucherError(f'Voucher ini hanya untuk paket {names}.')
    if coupon.once_per_account and user is not None and user.is_authenticated:
        others = live_uses(coupon).filter(user=user)
        if invitation:
            others = others.exclude(invitation=invitation)
        if others.exists():
            raise VoucherError('Voucher ini sudah pernah dipakai akun kamu.')
    return coupon


def current(invitation):
    """The invitation's live claim, or None."""
    return invitation.voucher_uses.filter(status='claimed').select_related('coupon').first()


@transaction.atomic
def claim(invitation, code, user):
    """Attach a voucher to the couple's invitation (replacing any earlier
    claim). The voucher row is locked, so the quota can't be overrun."""
    coupon = Coupon.objects.select_for_update().filter(code=normalise(code)).first()
    if not coupon:
        raise VoucherError('Kode voucher tidak ditemukan. Periksa ejaannya.')
    existing = current(invitation)
    if existing and existing.coupon_id == coupon.pk:
        return existing
    check(coupon, user=user, invitation=invitation)
    if existing:
        release(existing)
    return VoucherRedemption.objects.create(coupon=coupon, invitation=invitation, user=user)


def release(redemption):
    redemption.status, redemption.released_at = 'released', timezone.now()
    redemption.save(update_fields=['status', 'released_at'])


def release_claim(invitation):
    existing = current(invitation)
    if existing:
        release(existing)
    return existing


@transaction.atomic
def redeem(invitation, coupon, payment, tier, list_price):
    """The couple paid with `coupon`: turn their claim into a redemption, or
    record one if staff applied the voucher at payment. A claim for another
    voucher is released. Staff checked the voucher before calling this."""
    claimed = current(invitation)
    if claimed and claimed.coupon_id != coupon.pk:
        release(claimed)
        claimed = None
    use = claimed or VoucherRedemption(coupon=coupon, invitation=invitation, user=invitation.couple_user)
    use.status, use.tier, use.payment, use.redeemed_at = 'redeemed', tier, payment, timezone.now()
    use.discount = discount(coupon, list_price)
    use.save()
    return use


def public_data(coupon):
    """What a couple may see: the code, what it takes off, which plans, until when."""
    return {
        'code': coupon.code, 'discount_type': coupon.discount_type, 'discount_percent': coupon.discount_percent,
        'discount_amount': coupon.discount_amount, 'max_discount': coupon.max_discount,
        'plans': coupon.plans or list(PAID_TIERS), 'ends_at': coupon.ends_at.isoformat() if coupon.ends_at else None,
        'label': coupon.label(), 'description': coupon.description,
    }
