"""The backoffice (/backoffice, API at /api/staff/): activity recorded at the
right moments without personal data; a staff login that needs the
authenticator code and a session the couples' login can't stand in for;
revenue and reset links for the owner only; each staff action; and the Staf
group and activated_at backfill (migrations 0054/0055)."""
from datetime import timedelta
from urllib.parse import parse_qs, urlsplit

from django.contrib.admin.models import LogEntry
from django.contrib.auth.models import Group, User
from django.core.management import call_command
from django.test import Client, override_settings
from django.urls import reverse
from django.utils import timezone
from django_otp.oath import totp
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.test import APIClient

from apps.invitations import activity, funnel, themes
from apps.invitations.models import (
    AbuseReport, ActivityEvent, Coupon, CoupleProfile, Event, Guest, Invitation, Payment, RSVP,
)
from apps.invitations.retention import delete_invitation
from apps.invitations.staff_urls import urlpatterns as STAFF_PATTERNS

from .base import APITestBase
from .migration_base import MigrationTestCase

PASSWORD = 'x-Strong-pass-91'


class ActivityRecordingTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.client.force_authenticate(self.owner)

    def kinds(self):
        return list(ActivityEvent.objects.order_by('created_at').values_list('kind', flat=True))

    def test_register_is_recorded_with_its_source_only(self):
        self.client.force_authenticate(None)
        res = self.client.post('/api/auth/register/', {
            'username': 'sinta', 'password': PASSWORD, 'email': 'sinta@example.com', 'whatsapp': '081234567890',
            'utm': {'utm_source': 'ig'}}, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        ev = ActivityEvent.objects.get(kind='register')
        self.assertEqual(ev.user.username, 'sinta')
        self.assertEqual(ev.meta, {'source': 'ig'})

    def test_draft_theme_change_request_and_activation(self):
        res = self.client.post('/api/my/invitations/', {'slug': 'rani-dimas', 'wedding_date': '2027-02-14'}, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        inv = Invitation.objects.get(slug='rani-dimas')
        other = next(t for t in themes.entries() if themes.is_selectable(t) and t != inv.theme)
        self.client.patch('/api/my/invitations/rani-dimas/', {'theme': other}, format='json')
        self.client.patch('/api/my/invitations/rani-dimas/', {'opening_text': 'Halo'}, format='json')  # no theme change
        self.client.post('/api/my/invitations/rani-dimas/request-activation/')
        inv.refresh_from_db()
        inv.activation_code = 'A7K2QX'
        inv.save(update_fields=['activation_code'])
        self.client.post('/api/my/invitations/rani-dimas/activate/', {'code': 'a7k2qx'}, format='json')

        self.assertEqual(self.kinds(), ['invitation_created', 'theme_changed', 'activation_requested', 'activated'])
        self.assertEqual(ActivityEvent.objects.get(kind='theme_changed').meta['new'], other)
        inv.refresh_from_db()
        self.assertIsNotNone(inv.activated_at)

    def test_events_survive_account_deletion_without_the_link(self):
        inv = self.make_invitation(owner=self.owner)
        activity.record('activation_requested', inv, self.owner)
        delete_invitation(inv)
        self.owner.delete()
        ev = ActivityEvent.objects.get(kind='activation_requested')
        self.assertIsNone(ev.invitation)
        self.assertIsNone(ev.user)

    def test_old_activity_and_reports_are_pruned(self):
        old = activity.record('register')
        ActivityEvent.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=activity.KEEP_DAYS + 1))
        activity.record('register')
        report = AbuseReport.objects.create(url='a', reason='spam')
        AbuseReport.objects.filter(pk=report.pk).update(created_at=timezone.now() - timedelta(days=366))
        AbuseReport.objects.create(url='b', reason='spam')
        call_command('purge_expired', stdout=open('/dev/null', 'w'))
        self.assertEqual(ActivityEvent.objects.count(), 1)
        self.assertEqual(list(AbuseReport.objects.values_list('url', flat=True)), ['b'])


class ActivatedAtTests(APITestBase):
    def test_first_activation_is_stamped_once(self):
        inv = self.make_invitation(active=False)
        self.assertIsNone(inv.activated_at)
        inv.is_active = True
        inv.save(update_fields=['is_active'])
        inv.refresh_from_db()
        first = inv.activated_at
        self.assertIsNotNone(first)
        inv.is_active = False
        inv.save()
        inv.is_active = True
        inv.save()
        inv.refresh_from_db()
        self.assertEqual(inv.activated_at, first)


class StaffBase(APITestBase):
    """Helpers that log in through the staff login, with the OTP check off."""

    def staff(self, name='bantu', owner=False):
        user = User.objects.create_user(name, password=PASSWORD, is_staff=True, is_superuser=owner)
        if not owner:
            user.groups.add(Group.objects.get(name='Staf'))
        return user

    def login(self, user):
        self.client = APIClient()
        with override_settings(ADMIN_REQUIRE_OTP=False):
            res = self.client.post('/api/staff/login/', {'username': user.username, 'password': PASSWORD}, format='json')
        self.assertEqual(res.status_code, 200, res.content)

    def as_owner(self):
        self.login(User.objects.filter(username='pemilik').first() or self.staff('pemilik', owner=True))

    def as_helper(self):
        self.login(User.objects.filter(username='bantu').first() or self.staff())


@override_settings(ADMIN_REQUIRE_OTP=True)
class StaffLoginTests(StaffBase):
    def setUp(self):
        super().setUp()
        self.user = self.staff('pemilik', owner=True)
        self.device = TOTPDevice.objects.create(user=self.user, name='hp', confirmed=True)

    def code(self):
        d = self.device
        return str(totp(d.bin_key, d.step, d.t0, d.digits, d.drift)).zfill(6)

    def post(self, **data):
        return self.client.post('/api/staff/login/', {'username': 'pemilik', 'password': PASSWORD, **data}, format='json')

    def test_password_alone_is_not_enough(self):
        self.assertEqual(self.post().status_code, 400)
        self.assertEqual(self.client.get('/api/staff/me/').status_code, 401)

    def test_password_and_code_get_in(self):
        res = self.post(otp=self.code())
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {'username': 'pemilik', 'role': 'owner', 'can_see_revenue': True,
                                    'can_manage_vouchers': True})
        self.client.post('/api/auth/refresh/')   # the staff claim survives a refresh
        self.assertEqual(self.client.get('/api/staff/overview/').status_code, 200)

    def test_couples_cannot_log_in_here(self):
        self.make_user('pasangan')
        res = self.client.post('/api/staff/login/', {'username': 'pasangan', 'password': PASSWORD, 'otp': '000000'},
                               format='json')
        self.assertEqual(res.status_code, 400)

    def test_five_failures_lock_the_login_out(self):
        for _ in range(5):
            self.assertEqual(self.post(otp='000000').status_code, 400)
        self.assertEqual(self.post(otp=self.code()).status_code, 429)

    def test_the_couples_login_does_not_open_the_backoffice(self):
        res = self.client.post('/api/auth/login/', {'username': 'pemilik', 'password': PASSWORD}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.client.get('/api/staff/overview/').status_code, 403)


class StaffAccessTests(StaffBase):
    """Every /api/staff/ endpoint but the login refuses the anonymous, couples
    and staff whose session didn't come from the staff login. The ownership
    sweep (test_ownership) leaves api/staff/ to this class."""

    def check_denied(self, client):
        for p in STAFF_PATTERNS:
            route = str(p.pattern)
            if route == 'login/':
                continue
            url = '/api/staff/' + route.replace('<int:pk>', '1')
            for method in ('get', 'post'):
                with self.subTest(url=url, method=method):
                    self.assertIn(getattr(client, method)(url, {}, format='json').status_code, (401, 403, 405))

    def test_anonymous(self):
        self.check_denied(APIClient())

    def test_a_couple(self):
        client = APIClient()
        client.force_authenticate(self.make_user('pasangan'))
        self.check_denied(client)

    def test_staff_without_the_staff_login(self):
        client = APIClient()
        client.force_authenticate(self.staff())
        self.check_denied(client)

    def test_owner_only_endpoints(self):
        self.as_helper()
        couple = self.make_user('pasangan')
        self.assertEqual(self.client.get('/api/staff/revenue/').status_code, 403)
        self.assertEqual(self.client.post(f'/api/staff/couples/{couple.pk}/reset-link/').status_code, 403)
        self.assertEqual(self.client.get('/api/staff/me/').data,
                         {'username': 'bantu', 'role': 'staff', 'can_see_revenue': False,
                          'can_manage_vouchers': False})

    def test_staf_group(self):
        perms = set(Group.objects.get(name='Staf').permissions.values_list('codename', flat=True))
        self.assertIn('add_payment', perms)
        self.assertIn('change_abusereport', perms)
        self.assertNotIn('view_payment', perms)
        self.assertFalse(any(p.startswith('delete_') for p in perms))


class OverviewTests(StaffBase):
    def test_numbers_and_revenue_for_the_owner_only(self):
        inv = self.make_invitation(active=False, activation_requested=True,
                                   activation_requested_at=timezone.now() - timedelta(hours=26))
        Payment.objects.create(invitation=inv, tier='premium', amount=99000)
        demo = next(t['demoSlug'] for t in themes.entries().values() if t.get('demoSlug'))
        self.make_invitation(slug=demo, active=True)
        self.as_owner()
        numbers = self.client.get('/api/staff/overview/').data['numbers']
        self.assertEqual((numbers['pending_activations'], numbers['live'], numbers['revenue_month']), (1, 0, 99000))

        self.as_helper()
        res = self.client.get('/api/staff/overview/')
        self.assertNotIn('revenue_month', res.data['numbers'])
        self.assertNotIn(b'99000', res.content)

    def test_wedding_watch_flags_what_is_not_ready(self):
        soon = timezone.localdate() + timedelta(days=3)
        ready = self.make_invitation(slug='siap-nikah', wedding_date=soon)
        Event.objects.create(invitation=ready, event_type='akad', start=timezone.now() + timedelta(days=3),
                             venue_name='Masjid', address='Jl. Melati')
        Guest.objects.create(invitation=ready, name='Tamu', sent_at=timezone.now())
        self.make_invitation(slug='belum-siap', wedding_date=soon, active=False)
        self.make_invitation(slug='masih-lama', wedding_date=soon + timedelta(days=30))
        self.as_helper()
        rows = {w['slug']: w for w in self.client.get('/api/staff/watch/').data['results']}
        self.assertEqual(set(rows), {'siap-nikah', 'belum-siap'})
        self.assertEqual(rows['siap-nikah']['flags'], [])
        self.assertIn({'tone': 'bad', 'text': 'belum aktif'}, rows['belum-siap']['flags'])

    def test_activity_feed_filters(self):
        a = self.make_invitation(slug='andini-bagus')
        b = self.make_invitation(slug='sari-joko')
        activity.record('activation_requested', a)
        activity.record('guests_imported', b, count=12)
        activity.record('register')
        self.as_helper()
        res = self.client.get('/api/staff/activity/', {'kind': 'guests_imported'})
        self.assertEqual([r['text'] for r in res.data['results']], ['12 tamu diimpor'])
        res = self.client.get('/api/staff/activity/', {'slug': 'andini'})
        self.assertEqual([r['slug'] for r in res.data['results']], ['andini-bagus'])

    def test_system(self):
        self.as_helper()
        res = self.client.get('/api/staff/system/')
        self.assertIn('database', [c['key'] for c in res.data['checks']])


class InvitationTests(StaffBase):
    def test_status_filter_and_counts(self):
        today = timezone.localdate()
        live = self.make_invitation(slug='aktif')
        for i in range(3):
            Guest.objects.create(invitation=live, name=f'T{i}', open_count=2)
        self.make_invitation(slug='draf', active=False)
        self.make_invitation(slug='minta', active=False, activation_requested=True)
        self.make_invitation(slug='lewat', wedding_date=today - timedelta(days=200))
        self.as_helper()
        res = self.client.get('/api/staff/invitations/', {'status': 'live'})
        self.assertEqual([r['slug'] for r in res.data['results']], ['aktif'])
        row = res.data['results'][0]
        self.assertEqual((row['guests'], row['opens'], row['missing']), (3, 6, ['acara', 'foto']))
        self.assertEqual(res.data['status_counts'], {'purged': 0, 'expired': 1, 'live': 1, 'requested': 1, 'draft': 1})
        self.assertEqual(self.client.get('/api/staff/invitations/', {'q': 'Andini'}).data['count'], 4)

    def test_actions_are_audited(self):
        inv = self.make_invitation(slug='perpanjang')
        before = inv.expires_at
        self.as_helper()
        for action in ('extend', 'watermark_off', 'deactivate'):
            res = self.client.post(f'/api/staff/invitations/{inv.pk}/action/', {'action': action}, format='json')
            self.assertEqual(res.status_code, 200)
        res = self.client.post(f'/api/staff/invitations/{inv.pk}/action/', {'action': 'delete'}, format='json')
        self.assertEqual(res.status_code, 400)
        inv.refresh_from_db()
        self.assertEqual((inv.expires_at, inv.watermark, inv.is_active), (before + timedelta(days=30), False, False))
        self.assertEqual(ActivityEvent.objects.filter(kind='staff_action', invitation=inv).count(), 3)
        self.assertEqual(LogEntry.objects.filter(object_id=str(inv.pk)).count(), 3)

    def test_detail_shows_payments_to_the_owner_only(self):
        inv = self.make_invitation()
        Payment.objects.create(invitation=inv, tier='premium', amount=99000)
        self.as_helper()
        self.assertNotIn('payments', self.client.get(f'/api/staff/invitations/{inv.pk}/').data)
        self.as_owner()
        self.assertEqual(self.client.get(f'/api/staff/invitations/{inv.pk}/').data['payments'][0]['amount'], 99000)


class FulfillTests(StaffBase):
    def setUp(self):
        super().setUp()
        self.couple = self.make_user('pasangan')
        self.inv = self.make_invitation(owner=self.couple, active=False, activation_requested=True,
                                        activation_requested_at=timezone.now())

    def test_staff_record_a_payment_and_get_the_code(self):
        self.as_helper()
        self.assertEqual([r['slug'] for r in self.client.get('/api/staff/activations/').data['results']], [self.inv.slug])
        coupon = Coupon.objects.create(code='MUA10', discount_percent=10)
        res = self.client.post(f'/api/staff/activations/{self.inv.pk}/fulfill/', {
            'tier': 'bisnis', 'amount': 179000, 'channel': 'qris', 'coupon': coupon.pk}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        self.inv.refresh_from_db()
        self.assertEqual(res.data['activation_code'], self.inv.activation_code)
        payment = Payment.objects.get()
        self.assertEqual((payment.amount, payment.tier, payment.channel, payment.coupon, payment.recorded_by.username),
                         (179000, 'bisnis', 'qris', coupon, 'bantu'))
        self.assertEqual(CoupleProfile.objects.get(user=self.couple).max_invitations, 2)

    def test_bad_input_changes_nothing(self):
        self.as_helper()
        res = self.client.post(f'/api/staff/activations/{self.inv.pk}/fulfill/', {'tier': 'gold', 'amount': '-5'},
                               format='json')
        self.assertEqual((res.status_code, set(res.data)), (400, {'tier', 'amount'}))
        self.assertFalse(Payment.objects.exists())

    @override_settings(ADMIN_REQUIRE_OTP=False)
    def test_the_admin_action_records_the_payment_too(self):
        web = Client()
        web.force_login(self.staff('pemilik', owner=True))
        url = reverse('admin:invitations_activationrequest_changelist')
        self.assertContains(web.post(url, {'action': 'fulfill_premium', '_selected_action': [self.inv.pk]}),
                            'Jumlah diterima')
        web.post(url, {'action': 'fulfill_premium', '_selected_action': [self.inv.pk], 'apply': '1',
                       'amount': '99000', 'channel': 'transfer'})
        self.assertEqual(Payment.objects.get().amount, 99000)


class CoupleTests(StaffBase):
    def setUp(self):
        super().setUp()
        self.couple = self.make_user('rani', email='rani@example.com')
        CoupleProfile.objects.create(user=self.couple, whatsapp='081234567890')
        inv = self.make_invitation(owner=self.couple, slug='rani-dimas')
        Payment.objects.create(invitation=inv, tier='premium', amount=99000)

    def test_list_with_paid_for_the_owner(self):
        self.as_owner()
        rows = self.client.get('/api/staff/couples/').data['results']
        self.assertEqual([(r['username'], r['paid'], r['invitations'][0]['slug']) for r in rows],
                         [('rani', 99000, 'rani-dimas')])
        self.as_helper()
        self.assertNotIn('paid', self.client.get('/api/staff/couples/').data['results'][0])

    def test_allow_two_and_a_reset_link_that_works_once(self):
        self.as_owner()
        self.client.post(f'/api/staff/couples/{self.couple.pk}/allow-two/')
        self.assertEqual(CoupleProfile.objects.get(user=self.couple).max_invitations, 2)
        res = self.client.post(f'/api/staff/couples/{self.couple.pk}/reset-link/')
        self.assertIn('wa.me/6281234567890', res.data['whatsapp'])
        q = parse_qs(urlsplit(res.data['link']).query)
        body = {'uid': q['uid'][0], 'token': q['token'][0], 'password': 'An0ther-Strong-pass'}
        anon = APIClient()
        self.assertEqual(anon.post('/api/auth/password-reset-confirm/', body, format='json').status_code, 200)
        self.assertEqual(anon.post('/api/auth/password-reset-confirm/', body, format='json').status_code, 400)


class ModerationTests(StaffBase):
    def setUp(self):
        super().setUp()
        self.inv = self.make_invitation(slug='dilapor')
        self.as_helper()

    def test_hide_a_wish(self):
        rsvp = RSVP.objects.create(invitation=self.inv, guest_name='X', attending=True, wishes='kasar')
        self.assertEqual(self.client.get('/api/staff/wishes/').data['results'][0]['wishes'], 'kasar')
        self.client.post(f'/api/staff/wishes/{rsvp.pk}/', {'wish_status': 'hidden'}, format='json')
        rsvp.refresh_from_db()
        self.assertEqual(rsvp.wish_status, 'hidden')

    def test_log_a_report_take_it_down_and_restore(self):
        res = self.client.post('/api/staff/reports/', {'url': 'https://x/dilapor/', 'reason': 'impersonation',
                                                       'reporter': 'WA 0813'}, format='json')
        self.assertEqual((res.status_code, res.data['slug']), (201, 'dilapor'))
        self.assertEqual(self.client.get('/api/staff/overview/').data['numbers']['reports_new'], 1)
        pk = res.data['id']
        res = self.client.post(f'/api/staff/reports/{pk}/decide/', {'decision': 'takedown', 'note': 'jelas palsu'},
                               format='json')
        self.assertEqual((res.data['status'], res.data['invitation_active'], res.data['decided_by']),
                         ('takedown', False, 'bantu'))
        res = self.client.post(f'/api/staff/reports/{pk}/decide/', {'decision': 'restore'}, format='json')
        self.assertEqual((res.data['status'], res.data['invitation_active']), ('resolved', True))


class ThemesGrowthRevenueTests(StaffBase):
    def test_themes(self):
        a, b = [t for t in themes.entries() if themes.is_selectable(t)][:2]
        self.make_invitation(slug='satu', theme=a, tier='premium')
        self.make_invitation(slug='dua', theme=a, active=False)
        moved = self.make_invitation(slug='tiga', theme=b)
        activity.record('theme_changed', moved, old=a, new=b)
        activity.record('invitation_created', moved, theme=a)
        self.as_helper()
        rows = self.client.get('/api/staff/themes/').data['results']
        by_id = {r['id']: r for r in rows}
        self.assertEqual([by_id[a][k] for k in ('total', 'live', 'paid', 'away', 'created')], [2, 1, 1, 1, 1])
        self.assertEqual((by_id[b]['total'], by_id[b]['to']), (1, 1))
        self.assertEqual(rows[0]['id'], a)

    def test_growth_and_revenue(self):
        for step, n in (('visit', 10), ('register', 4), ('onboarded', 2)):
            for _ in range(n):
                funnel.record(step, {'utm_source': 'ig'})
        coupon = Coupon.objects.create(code='MUA10', discount_percent=10)
        inv = self.make_invitation()
        Payment.objects.create(invitation=inv, tier='premium', amount=89000, channel='qris', coupon=coupon)
        Payment.objects.create(invitation=inv, tier='bisnis', amount=179000)
        self.as_helper()
        res = self.client.get('/api/staff/growth/')
        self.assertEqual(res.data['sources'][0], {'source': 'ig', 'visit': 10, 'register': 4, 'onboarded': 2})
        self.assertEqual(res.data['coupons'][0]['used'], 1)
        self.assertNotIn('revenue', res.data['coupons'][0])

        self.as_owner()
        res = self.client.get('/api/staff/revenue/')
        self.assertEqual((res.data['total'], len(res.data['months']), res.data['months'][-1]['total']),
                         (268000, 12, 268000))
        self.assertEqual([r['label'] for r in res.data['by_coupon']], ['(tanpa kupon)', 'MUA10'])


class ActivatedAtBackfillTests(MigrationTestCase):
    migrate_from = '0053_backoffice'
    migrate_to = '0054_backoffice_staff_group'

    def setUpBeforeMigration(self, apps):
        self.make_old_invitation(apps, slug='sudah-aktif', is_active=True)
        self.make_old_invitation(apps, slug='masih-draf', is_active=False)

    def test_live_invitations_get_an_activation_time(self):
        Invitation = self.apps.get_model('invitations', 'Invitation')
        self.assertIsNotNone(Invitation.objects.get(slug='sudah-aktif').activated_at)
        self.assertIsNone(Invitation.objects.get(slug='masih-draf').activated_at)
