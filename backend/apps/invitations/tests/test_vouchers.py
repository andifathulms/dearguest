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
        # Other TransactionTestCases flush the plans migration 0045 seeds.
        apps.get_model('invitations', 'Plan').objects.update_or_create(
            slug='premium', defaults={'name': 'Premium', 'price': 99000})
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


class CoupleVoucherTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.voucher = Coupon.objects.create(code='HEMAT20', discount_percent=20, max_discount=30000)
        self.owner = self.make_user('rani')
        self.inv = self.make_invitation(owner=self.owner, slug='rani-dimas', active=False)
        self.client.force_authenticate(self.owner)
        self.url = '/api/my/invitations/rani-dimas/voucher/'

    def test_public_check_shows_the_prices(self):
        self.client.force_authenticate(None)
        res = self.client.get('/api/coupons/validate/', {'code': ' hemat20 '})
        self.assertEqual((res.data['valid'], res.data['label']), (True, '20%'))
        self.assertEqual(res.data['prices']['premium']['final'], 79200)
        self.assertEqual(res.data['prices']['bisnis']['discount'], 30000)   # 20% of 179000 capped
        res = self.client.get('/api/coupons/validate/', {'code': 'NOPE'})
        self.assertEqual(res.data, {'valid': False, 'reason': 'Kode voucher tidak ditemukan. Periksa ejaannya.'})

    def test_paste_remove_and_errors(self):
        self.assertIsNone(self.client.get(self.url).data['voucher'])
        res = self.client.post(self.url, {'code': 'hemat20'}, format='json')
        self.assertEqual((res.status_code, res.data['voucher']['code']), (200, 'HEMAT20'))
        self.assertEqual(res.data['prices']['premium']['final'], 79200)
        res = self.client.post(self.url, {'code': 'SALAH'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(self.client.get(self.url).data['voucher']['code'], 'HEMAT20')   # the old one stays
        self.assertIsNone(self.client.delete(self.url).data['voucher'])
        self.assertEqual(vouchers.used(self.voucher), 0)

    def test_not_after_the_invitation_is_live(self):
        self.inv.is_active = True
        self.inv.save()
        self.assertEqual(self.client.post(self.url, {'code': 'HEMAT20'}, format='json').status_code, 409)

    def test_the_activation_request_carries_the_code(self):
        from django.core import mail
        from apps.invitations.models import ActivityEvent
        self.client.post(self.url, {'code': 'HEMAT20'}, format='json')
        self.client.post('/api/my/invitations/rani-dimas/request-activation/')
        self.assertIn('Voucher : HEMAT20 (20%)', mail.outbox[-1].body)
        self.assertEqual(ActivityEvent.objects.get(kind='activation_requested').meta['voucher'], 'HEMAT20')


class StaffRedeemTests(APITestBase):
    def setUp(self):
        super().setUp()
        from django.contrib.auth.models import Group
        from django.test import override_settings
        self.voucher = Coupon.objects.create(code='HEMAT20', discount_percent=20, plans=['premium'], quota=1)
        self.owner = self.make_user('rani')
        self.inv = self.make_invitation(owner=self.owner, active=False, activation_requested=True,
                                        activation_requested_at=timezone.now())
        vouchers.claim(self.inv, 'HEMAT20', self.owner)
        staff = User.objects.create_user('bantu', password='x-Strong-pass-91', is_staff=True)
        staff.groups.add(Group.objects.get(name='Staf'))
        with override_settings(ADMIN_REQUIRE_OTP=False):
            self.client.post('/api/staff/login/', {'username': 'bantu', 'password': 'x-Strong-pass-91'}, format='json')
        self.url = f'/api/staff/activations/{self.inv.pk}/fulfill/'

    def test_the_list_shows_the_voucher_and_the_price_after_it(self):
        row = self.client.get('/api/staff/activations/').data['results'][0]
        self.assertEqual((row['voucher']['code'], row['prices']['premium']['final']), ('HEMAT20', 79200))

    def test_paying_with_the_claimed_voucher_redeems_it(self):
        res = self.client.post(self.url, {'tier': 'premium', 'amount': 79200, 'coupon': self.voucher.pk}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        use = VoucherRedemption.objects.get()
        self.assertEqual((use.status, use.discount, use.payment.amount), ('redeemed', 19800, 79200))
        self.assertEqual(vouchers.state(self.voucher), 'exhausted')

    def test_a_voucher_that_does_not_fit_the_plan_records_nothing(self):
        res = self.client.post(self.url, {'tier': 'bisnis', 'amount': 179000, 'coupon': self.voucher.pk}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('hanya untuk paket Premium', res.data['coupon'])
        self.assertFalse(Payment.objects.exists())
        self.inv.refresh_from_db()
        self.assertEqual(self.inv.activation_code, '')

    def test_paying_without_a_voucher_releases_the_claim(self):
        self.client.post(self.url, {'tier': 'bisnis', 'amount': 179000}, format='json')
        self.assertEqual(VoucherRedemption.objects.get().status, 'released')
        self.assertEqual(vouchers.left(self.voucher), 1)


class StaffVoucherApiTests(APITestBase):
    def setUp(self):
        super().setUp()
        from django.contrib.auth.models import Group
        self.owner = User.objects.create_user('pemilik', password='x-Strong-pass-91', is_staff=True, is_superuser=True)
        self.helper = User.objects.create_user('bantu', password='x-Strong-pass-91', is_staff=True)
        self.helper.groups.add(Group.objects.get(name='Staf'))

    def login(self, user):
        from django.test import override_settings
        from rest_framework.test import APIClient
        self.client = APIClient()
        with override_settings(ADMIN_REQUIRE_OTP=False):
            self.client.post('/api/staff/login/', {'username': user.username, 'password': 'x-Strong-pass-91'}, format='json')

    def create(self, **data):
        return self.client.post('/api/staff/vouchers/', data, format='json')

    def test_owner_makes_percent_and_nominal_vouchers(self):
        self.login(self.owner)
        res = self.create(code='nikah 2027', discount_type='percent', discount_percent=15, max_discount=20000,
                          plans=['premium', 'bisnis'], quota=50, starts_at='2026-12-01T00:00',
                          ends_at='2027-01-31T23:59', description='Promo akhir tahun')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual((res.data['code'], res.data['label'], res.data['plans'], res.data['left']),
                         ('NIKAH2027', '15%', [], 50))
        start = timezone.localtime(Coupon.objects.get(code='NIKAH2027').starts_at)
        self.assertEqual((start.hour, str(start.tzinfo)), (0, 'Asia/Jakarta'))   # the form's time is WIB
        self.assertEqual(res.data['state'], 'scheduled')
        res = self.create(code='', discount_type='amount', discount_amount='25.000', plans=['bisnis'])
        self.assertEqual(res.status_code, 201, res.data)
        self.assertRegex(res.data['code'], r'^VV-')
        self.assertEqual((res.data['label'], res.data['prices']['bisnis']['final']), ('Rp25.000', 154000))
        self.assertEqual(Coupon.objects.get(code=res.data['code']).created_by, self.owner)

    def test_bad_input_is_explained_per_field(self):
        self.login(self.owner)
        Coupon.objects.create(code='ADA', discount_percent=10)
        res = self.create(code='ada', discount_type='percent', discount_percent=150, quota=0, plans=['gratis'],
                          starts_at='2027-01-02T00:00', ends_at='2027-01-01T00:00')
        self.assertEqual(set(res.data), {'code', 'discount_percent', 'quota', 'plans', 'ends_at'})
        res = self.create(code='X!', discount_type='amount', discount_amount='')
        self.assertEqual(set(res.data), {'code', 'discount_amount'})

    def test_used_vouchers_keep_code_and_discount_and_cannot_be_deleted(self):
        self.login(self.owner)
        c = Coupon.objects.create(code='DIPAKAI', discount_percent=10, quota=5, once_per_account=False)
        for slug in ('a1', 'a2'):
            vouchers.claim(self.make_invitation(slug=slug), 'DIPAKAI', None)
        url = f'/api/staff/vouchers/{c.pk}/'
        res = self.client.patch(url, {'code': 'BARU', 'discount_percent': 50, 'quota': 1}, format='json')
        self.assertEqual(set(res.data), {'code', 'discount_type', 'quota'})
        res = self.client.patch(url, {'quota': 10, 'active': False, 'description': 'Habis promo'}, format='json')
        self.assertEqual((res.status_code, res.data['quota'], res.data['state'], res.data['used']), (200, 10, 'inactive', 2))
        self.assertEqual([u['slug'] for u in res.data['uses']], ['a2', 'a1'])
        self.assertEqual(self.client.delete(url).status_code, 409)
        unused = Coupon.objects.create(code='KOSONG', discount_percent=5)
        self.assertEqual(self.client.delete(f'/api/staff/vouchers/{unused.pk}/').status_code, 204)

    def test_switching_type_needs_the_new_value(self):
        self.login(self.owner)
        c = Coupon.objects.create(code='GANTI', discount_percent=10)
        res = self.client.patch(f'/api/staff/vouchers/{c.pk}/', {'discount_type': 'amount'}, format='json')
        self.assertIn('discount_amount', res.data)

    def test_staff_can_read_but_not_change(self):
        c = Coupon.objects.create(code='LIHAT', discount_percent=10)
        self.login(self.helper)
        res = self.client.get('/api/staff/vouchers/')
        self.assertEqual(res.data['results'][0]['code'], 'LIHAT')
        self.assertNotIn('discount_total', res.data['results'][0])
        self.assertEqual(self.create(code='BARU', discount_percent=10).status_code, 403)
        self.assertEqual(self.client.patch(f'/api/staff/vouchers/{c.pk}/', {'active': False}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(f'/api/staff/vouchers/{c.pk}/').status_code, 403)

    def test_list_filters_and_counts(self):
        now = timezone.now()
        Coupon.objects.create(code='JALAN', discount_percent=10)
        Coupon.objects.create(code='NANTI', discount_percent=10, starts_at=now + timedelta(days=3))
        Coupon.objects.create(code='LEWAT', discount_percent=10, ends_at=now - timedelta(days=1))
        self.login(self.owner)
        res = self.client.get('/api/staff/vouchers/', {'state': 'scheduled'})
        self.assertEqual([r['code'] for r in res.data['results']], ['NANTI'])
        self.assertEqual(res.data['state_counts'], {'active': 1, 'scheduled': 1, 'ended': 1, 'exhausted': 0, 'inactive': 0})
        self.assertRegex(self.client.get('/api/staff/vouchers/new-code/').data['code'], r'^VV-')
