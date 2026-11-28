"""Coupons become vouchers (0056): the old expiry date becomes the end of that
day in WIB, and payments made with a coupon before vouchers existed count as
redeemed uses, so they take their place in a quota. The Staf group may see
vouchers' uses; making or changing vouchers stays with the owner."""
from datetime import datetime, time
from zoneinfo import ZoneInfo

from django.db import migrations

WIB = ZoneInfo('Asia/Jakarta')


def forwards(apps, schema_editor):
    from django.contrib.auth.management import create_permissions

    Coupon = apps.get_model('invitations', 'Coupon')
    for coupon in Coupon.objects.filter(expires_at__isnull=False, ends_at__isnull=True):
        coupon.ends_at = datetime.combine(coupon.expires_at, time(23, 59, 59), tzinfo=WIB)
        coupon.save(update_fields=['ends_at'])

    Payment = apps.get_model('invitations', 'Payment')
    Plan = apps.get_model('invitations', 'Plan')
    Redemption = apps.get_model('invitations', 'VoucherRedemption')
    prices = dict(Plan.objects.values_list('slug', 'price'))
    for p in Payment.objects.filter(coupon__isnull=False).select_related('coupon', 'invitation'):
        if Redemption.objects.filter(payment=p).exists():
            continue
        list_price = prices.get(p.tier, 0)
        Redemption.objects.create(
            coupon=p.coupon, invitation=p.invitation, user=p.invitation.couple_user if p.invitation else None,
            status='redeemed', tier=p.tier, payment=p, redeemed_at=p.created_at,
            discount=min(list_price * p.coupon.discount_percent // 100, list_price))

    for app_config in apps.get_app_configs():
        app_config.models_module = True
        create_permissions(app_config, apps=apps, verbosity=0)
        app_config.models_module = None
    group = apps.get_model('auth', 'Group').objects.filter(name='Staf').first()
    if group:
        group.permissions.add(*apps.get_model('auth', 'Permission').objects.filter(
            content_type__app_label='invitations', codename='view_voucherredemption'))


class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('invitations', '0056_vouchers'),
    ]

    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
