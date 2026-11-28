"""Vouchers (vouchers.py): discounts by percent with a cap or by amount, the
time window, plans, quota (claims hold a place, removing a code frees it, the
last place can't be taken twice), once per account, and the coupon data
migration (0057)."""
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.utils import timezone

from apps.invitations import vouchers
from apps.invitations.models import Coupon, Payment, VoucherRedemption
from apps.invitations.vouchers import VoucherError

from .base import APITestBase
from .migration_base import MigrationTestCase


class VoucherRuleTests(APITestBase):
    def make(self, **kw):
        return Coupon.objects.create(**{'code': 'HEMAT', 'discount_percent': 20, **kw})

    def test_codes_are_normalised(self):
        self.assertEqual(vouchers.normalise('  hemat 20! '), 'HEMAT20')
        c = self.make(code=' cinta20 ')
        self.assertEqual(c.code, 'CINTA20')
        self.assertEqual(vouchers.check(' Cinta20\n'), c)
        self.assertRegex(vouchers.generate_code(), r'^VV-[2-9A-Z]{6}$')

    def test_percent_with_a_cap_and_nominal(self):
        pct = self.make(discount_percent=20, max_discount=15000)
        self.assertEqual(vouchers.discount(pct, 50000), 10000)
        self.assertEqual(vouchers.discount(pct, 99000), 15000)   # capped
        flat = self.make(code='POTONG', discount_type='amount', discount_amount=25000)
        self.assertEqual(vouchers.discount(flat, 99000), 25000)
        self.assertEqual(vouchers.discount(flat, 20000), 20000)  # never below zero
        self.assertEqual(vouchers.discount(flat, 0), 0)

    def test_prices_for_the_paid_plans(self):
        c = self.make(discount_percent=10, plans=['premium'])
        p = vouchers.prices(c)
        self.assertEqual(p['premium'], {'name': 'Premium', 'price': 99000, 'discount': 9900, 'final': 89100})
        self.assertEqual(p['bisnis']['discount'], 0)   # not for Bisnis

    def test_window_active_and_plan(self):
        now = timezone.now()
        cases = [
            (dict(active=False), 'tidak berlaku', 'inactive'),
            (dict(starts_at=now + timedelta(days=1)), 'baru berlaku mulai', 'scheduled'),
            (dict(ends_at=now - timedelta(minutes=1)), 'sudah habis', 'ended'),
        ]
        for i, (kw, message, state) in enumerate(cases):
            c = self.make(code=f'C{i}XX', **kw)
            with self.subTest(state=state):
                self.assertEqual(vouchers.state(c), state)
                with self.assertRaisesMessage(VoucherError, message):
                    vouchers.check(c)
        c = self.make(code='BISNIS', plans=['bisnis'])
        with self.assertRaisesMessage(VoucherError, 'hanya untuk paket Bisnis'):
            vouchers.check(c, tier='premium')
        self.assertEqual(vouchers.check(c, tier='bisnis'), c)
        with self.assertRaisesMessage(VoucherError, 'tidak ditemukan'):
            vouchers.check('TIDAKADA')

    def test_quota_claims_and_release(self):
        c = self.make(quota=2, once_per_account=False)
        a, b, third = (self.make_invitation(slug=s) for s in ('satu', 'dua', 'tiga'))
        vouchers.claim(a, 'hemat', a.couple_user)
        vouchers.claim(b, 'HEMAT', None)
        self.assertEqual((vouchers.used(c), vouchers.left(c), vouchers.state(c)), (2, 0, 'exhausted'))
        with self.assertRaisesMessage(VoucherError, 'Kuota'):
            vouchers.claim(third, 'HEMAT', None)
        vouchers.claim(a, 'HEMAT', None)   # re-pasting the code it holds is fine
        vouchers.release_claim(b)
        self.assertEqual(vouchers.left(c), 1)
        vouchers.claim(third, 'HEMAT', None)
        self.assertEqual(vouchers.left(c), 0)

    def test_deleting_a_draft_frees_its_place_but_paid_uses_stay(self):
        c = self.make(quota=5, once_per_account=False)
        draft, paid = self.make_invitation(slug='draf'), self.make_invitation(slug='lunas')
        vouchers.claim(draft, 'HEMAT', None)
        vouchers.claim(paid, 'HEMAT', None)
        payment = Payment.objects.create(invitation=paid, tier='premium', amount=79200, coupon=c)
        vouchers.redeem(paid, c, payment, 'premium', 99000)
        draft.delete()
        paid.delete()
        self.assertEqual(vouchers.used(c), 1)
        self.assertEqual(VoucherRedemption.objects.get(status='redeemed').discount, 19800)

    def test_once_per_account(self):
        c = self.make()
        owner = self.make_user('rani')
        first = self.make_invitation(owner=owner, slug='akad')
        second = self.make_invitation(owner=owner, slug='ngunduh')
        vouchers.claim(first, 'HEMAT', owner)
        with self.assertRaisesMessage(VoucherError, 'sudah pernah dipakai akun kamu'):
            vouchers.claim(second, 'HEMAT', owner)
        self.assertEqual(vouchers.check(c, user=owner, invitation=first), c)

    def test_a_new_code_replaces_the_old_claim(self):
        self.make()
        other = self.make(code='LAIN', discount_type='amount', discount_amount=10000)
        inv = self.make_invitation()
        vouchers.claim(inv, 'HEMAT', None)
        vouchers.claim(inv, 'LAIN', None)
        self.assertEqual(vouchers.current(inv).coupon, other)
        self.assertEqual(list(VoucherRedemption.objects.order_by('created_at').values_list('status', flat=True)),
                         ['released', 'claimed'])

    def test_redeeming_with_another_voucher_releases_the_claim(self):
        self.make()
        other = self.make(code='STAF', discount_type='amount', discount_amount=5000)
        inv = self.make_invitation()
        vouchers.claim(inv, 'HEMAT', None)
        payment = Payment.objects.create(invitation=inv, tier='premium', amount=94000, coupon=other)
        use = vouchers.redeem(inv, other, payment, 'premium', 99000)
        self.assertEqual((use.coupon, use.discount, vouchers.current(inv)), (other, 5000, None))


class CouponToVoucherMigrationTests(MigrationTestCase):
    migrate_from = '0055_abuse_reports'
    migrate_to = '0057_vouchers_data'

    def setUpBeforeMigration(self, apps):
        Coupon = apps.get_model('invitations', 'Coupon')
        Payment = apps.get_model('invitations', 'Payment')
        coupon = Coupon.objects.create(code='CINTA20', discount_percent=20, expires_at=date(2026, 12, 31))
        inv = self.make_old_invitation(apps)
        Payment.objects.create(invitation=inv, tier='premium', amount=79200, coupon=coupon)

    def test_expiry_becomes_end_of_day_and_old_payments_count(self):
        Coupon = self.apps.get_model('invitations', 'Coupon')
        coupon = Coupon.objects.get(code='CINTA20')
        end = timezone.localtime(coupon.ends_at)
        self.assertEqual((end.date(), end.hour, end.minute), (date(2026, 12, 31), 23, 59))
        self.assertEqual(coupon.discount_type, 'percent')
        use = self.apps.get_model('invitations', 'VoucherRedemption').objects.get()
        self.assertEqual((use.status, use.tier, use.discount), ('redeemed', 'premium', 19800))
