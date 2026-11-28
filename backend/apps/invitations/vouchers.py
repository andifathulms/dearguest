"""Vouchers (the Coupon model): who may use a code, what it takes off, and its
place in the quota.

A couple pastes a code on the landing page (a preview of the price) or on
their invitation in the editor, which claims it: the claim holds one place in
the quota until staff confirm the payment (redeemed) or the code is removed
(released). Claims lock the voucher row, so two couples can't both take the
last place."""
import re
import secrets
from zoneinfo import ZoneInfo

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import GUEST_CODE_ALPHABET, Coupon, Plan, VoucherRedemption

CODE_RE = re.compile(r'^[A-Z0-9][A-Z0-9-]{2,29}$')
PAID_TIERS = ('premium', 'bisnis')
WIB = ZoneInfo('Asia/Jakarta')


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


# ---- making and changing vouchers (backoffice) ----

def _int(value):
    if value in (None, ''):
        return None
    try:
        n = int(str(value).replace('.', '').strip())
    except ValueError:
        raise ValueError
    if n < 0:
        raise ValueError
    return n


def _when(value):
    """An ISO date-time; without an offset (a datetime-local input) it means WIB."""
    if value in (None, ''):
        return None
    dt = parse_datetime(str(value))
    if dt is None:
        raise ValueError
    return dt if timezone.is_aware(dt) else timezone.make_aware(dt, WIB)


def clean(data, instance=None):
    """(fields, errors) for a voucher from the backoffice form; errors by field,
    in Indonesian. A used voucher keeps its code and discount, and its quota
    can't go below what is already used."""
    errors, out = {}, {}
    in_use = bool(instance and instance.pk and instance.redemptions.exists())
    taken = used(instance) if instance and instance.pk else 0

    def given(name):
        return name in data or instance is None

    if given('code'):
        code = normalise(data.get('code')) or (instance.code if instance else generate_code())
        if not CODE_RE.match(code):
            errors['code'] = 'Kode 3 sampai 30 karakter: huruf, angka, atau tanda hubung.'
        elif Coupon.objects.filter(code=code).exclude(pk=getattr(instance, 'pk', None)).exists():
            errors['code'] = 'Kode ini sudah dipakai voucher lain.'
        elif in_use and code != instance.code:
            errors['code'] = 'Voucher yang sudah dipakai tidak bisa ganti kode.'
        out['code'] = code

    kind = data.get('discount_type', instance.discount_type if instance else 'percent')
    if kind not in dict(Coupon.TYPES):
        errors['discount_type'] = 'Pilih persentase atau nominal.'
    out['discount_type'] = kind
    switched = bool(instance and instance.pk and kind != instance.discount_type)
    try:
        if kind == 'percent' and (given('discount_percent') or switched):
            pct = _int(data.get('discount_percent'))
            if pct is None or not 1 <= pct <= 100:
                raise ValueError
            out['discount_percent'] = pct
        if kind == 'amount' and (given('discount_amount') or switched):
            amount = _int(data.get('discount_amount'))
            if not amount:
                raise ValueError
            out['discount_amount'] = amount
    except ValueError:
        field = 'discount_percent' if kind == 'percent' else 'discount_amount'
        errors[field] = 'Isi persen 1 sampai 100.' if kind == 'percent' else 'Isi potongan dalam rupiah, mis. 25000.'
    if in_use and any(out.get(k, getattr(instance, k)) != getattr(instance, k)
                      for k in ('discount_type', 'discount_percent', 'discount_amount')):
        errors['discount_type'] = 'Voucher yang sudah dipakai tidak bisa ganti potongannya. Buat voucher baru.'

    if given('max_discount'):
        try:
            out['max_discount'] = _int(data.get('max_discount')) if kind == 'percent' else None
        except ValueError:
            errors['max_discount'] = 'Isi potongan maksimal dalam rupiah, atau kosongkan.'

    if given('plans'):
        plans = data.get('plans') or []
        if not isinstance(plans, list) or any(p not in PAID_TIERS for p in plans):
            errors['plans'] = 'Pilih paket Premium dan/atau Bisnis.'
        out['plans'] = [] if set(plans) >= set(PAID_TIERS) else sorted(set(plans))

    if given('quota'):
        try:
            quota = _int(data.get('quota'))
            if quota == 0:
                raise ValueError
            if quota is not None and quota < taken:
                errors['quota'] = f'Sudah dipakai {taken} kali; kuota tidak bisa kurang dari itu.'
            out['quota'] = quota
        except ValueError:
            errors['quota'] = 'Isi kuota minimal 1, atau kosongkan untuk tanpa batas.'

    for name in ('starts_at', 'ends_at'):
        if given(name):
            try:
                out[name] = _when(data.get(name))
            except ValueError:
                errors[name] = 'Tanggal dan jam tidak dikenali.'
    start = out.get('starts_at', getattr(instance, 'starts_at', None))
    end = out.get('ends_at', getattr(instance, 'ends_at', None))
    if start and end and end <= start and 'ends_at' not in errors:
        errors['ends_at'] = 'Waktu berakhir harus setelah waktu mulai.'

    for name in ('once_per_account', 'active'):
        if name in data:
            out[name] = bool(data.get(name))
    if given('description'):
        out['description'] = str(data.get('description') or '').strip()[:200]
    return out, errors
