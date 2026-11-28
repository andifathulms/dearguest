"""The backoffice (backoffice.py): activity recorded at the right moments and
without personal data, the overview and its pages for staff only, revenue for
the owner only, payments recorded when confirming an activation, and the
Staf group and activated_at backfill (migration 0054)."""
from datetime import timedelta

from django.contrib.auth.models import Group, User
from django.test import Client, override_settings
from django.urls import reverse
from django.utils import timezone

from apps.invitations import activity, themes
from apps.invitations.models import ActivityEvent, Coupon, CoupleProfile, Event, Guest, Invitation, Payment

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
        changed = ActivityEvent.objects.get(kind='theme_changed')
        self.assertEqual(changed.meta['new'], other)
        inv.refresh_from_db()
        self.assertIsNotNone(inv.activated_at)

    def test_events_survive_account_deletion_without_the_link(self):
        inv = self.make_invitation(owner=self.owner)
        activity.record('activation_requested', inv, self.owner)
        from apps.invitations.retention import delete_invitation
        delete_invitation(inv)
        self.owner.delete()
        ev = ActivityEvent.objects.get(kind='activation_requested')
        self.assertIsNone(ev.invitation)
        self.assertIsNone(ev.user)

    def test_prune_keeps_recent_rows(self):
        old = activity.record('register')
        ActivityEvent.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=activity.KEEP_DAYS + 1))
        activity.record('register')
        self.assertEqual(activity.prune(), 1)
        self.assertEqual(ActivityEvent.objects.count(), 1)


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


@override_settings(ADMIN_REQUIRE_OTP=False)
class BackofficePageTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user('pemilik', password=PASSWORD, is_staff=True, is_superuser=True)
        self.helper = User.objects.create_user('bantu', password=PASSWORD, is_staff=True)
        self.helper.groups.add(Group.objects.get(name='Staf'))
        self.web = Client()

    def get(self, user, name, **query):
        self.web.force_login(user)
        return self.web.get(reverse(name), query)

    def test_pages_need_staff(self):
        couple = self.make_user('pasangan')
        for name in ('admin:index', 'admin:ops_activity', 'admin:ops_watch', 'admin:ops_system'):
            self.assertEqual(self.web.get(reverse(name)).status_code, 302, name)   # to the admin login
            self.web.force_login(couple)
            self.assertEqual(self.web.get(reverse(name)).status_code, 302, name)
            self.web.logout()

    def test_overview_counts_and_revenue_for_the_owner_only(self):
        inv = self.make_invitation(active=False, activation_requested=True,
                                   activation_requested_at=timezone.now() - timedelta(hours=26))
        Payment.objects.create(invitation=inv, tier='premium', amount=99000)
        res = self.get(self.owner, 'admin:index')
        self.assertEqual(res.status_code, 200)
        kpis = {k['label']: k['value'] for k in res.context['kpis']}
        self.assertEqual(kpis['Menunggu aktivasi'], 1)
        self.assertEqual(kpis['Pendapatan · bulan ini'], 'Rp 99.000')
        self.assertContains(res, 'Rp 99.000')

        res = self.get(self.helper, 'admin:index')
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('Pendapatan · bulan ini', [k['label'] for k in res.context['kpis']])
        self.assertNotContains(res, '99.000')
        self.assertEqual(self.get(self.helper, 'admin:invitations_payment_changelist').status_code, 403)

    def test_demo_invitations_are_not_counted(self):
        demo = next(t['demoSlug'] for t in themes.entries().values() if t.get('demoSlug'))
        self.make_invitation(slug=demo, active=True)
        res = self.get(self.owner, 'admin:index')
        self.assertEqual({k['label']: k['value'] for k in res.context['kpis']}['Undangan aktif'], 0)

    def test_wedding_watch_flags_what_is_not_ready(self):
        soon = timezone.localdate() + timedelta(days=3)
        ready = self.make_invitation(slug='siap-nikah', wedding_date=soon)
        Event.objects.create(invitation=ready, event_type='akad', start=timezone.now() + timedelta(days=3),
                             venue_name='Masjid', address='Jl. Melati')
        Guest.objects.create(invitation=ready, name='Tamu', sent_at=timezone.now())
        self.make_invitation(slug='belum-siap', wedding_date=soon, active=False)
        self.make_invitation(slug='masih-lama', wedding_date=soon + timedelta(days=30))
        res = self.get(self.helper, 'admin:ops_watch')
        rows = {w['inv'].slug: w for w in res.context['watch']}
        self.assertEqual(set(rows), {'siap-nikah', 'belum-siap'})
        self.assertEqual(rows['siap-nikah']['flags'], [])
        self.assertIn(('crit', 'belum aktif'), rows['belum-siap']['flags'])

    def test_activity_feed_filters_by_kind_and_slug(self):
        a = self.make_invitation(slug='andini-bagus')
        b = self.make_invitation(slug='sari-joko')
        activity.record('activation_requested', a)
        activity.record('guests_imported', b, count=12)
        activity.record('register')
        res = self.get(self.helper, 'admin:ops_activity', kind='guests_imported')
        self.assertEqual([r['text'] for r in res.context['rows']], ['12 tamu diimpor'])
        res = self.get(self.helper, 'admin:ops_activity', slug='andini')
        self.assertEqual([r['slug'] for r in res.context['rows']], ['andini-bagus'])

    def test_system_page_renders(self):
        res = self.get(self.helper, 'admin:ops_system')
        self.assertEqual(res.status_code, 200)
        self.assertIn('Database', res.context['checks'])


@override_settings(ADMIN_REQUIRE_OTP=False)
class FulfillWithPaymentTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.couple = self.make_user('pasangan')
        self.inv = self.make_invitation(owner=self.couple, active=False, activation_requested=True,
                                        activation_requested_at=timezone.now())
        self.url = reverse('admin:invitations_activationrequest_changelist')
        self.web = Client()

    def staff(self, name, superuser=False):
        user = User.objects.create_user(name, password=PASSWORD, is_staff=True, is_superuser=superuser)
        if not superuser:
            user.groups.add(Group.objects.get(name='Staf'))
        self.web.force_login(user)
        return user

    def test_action_asks_for_the_amount_first(self):
        self.staff('pemilik', superuser=True)
        res = self.web.post(self.url, {'action': 'fulfill_premium', '_selected_action': [self.inv.pk]})
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Jumlah diterima')
        self.assertFalse(Payment.objects.exists())
        self.inv.refresh_from_db()
        self.assertEqual(self.inv.activation_code, '')

    def test_staff_records_a_payment_but_cannot_see_it(self):
        helper = self.staff('bantu')
        coupon = Coupon.objects.create(code='MUA10', discount_percent=10)
        res = self.web.post(self.url, {'action': 'fulfill_bisnis', '_selected_action': [self.inv.pk], 'apply': '1',
                                       'amount': '179000', 'channel': 'qris', 'coupon': coupon.pk, 'note': ''})
        self.assertEqual(res.status_code, 302)
        payment = Payment.objects.get()
        self.assertEqual((payment.amount, payment.tier, payment.channel, payment.coupon, payment.recorded_by),
                         (179000, 'bisnis', 'qris', coupon, helper))
        self.inv.refresh_from_db()
        self.assertEqual(self.inv.tier, 'bisnis')
        self.assertTrue(self.inv.activation_code)
        self.assertEqual(CoupleProfile.objects.get(user=self.couple).max_invitations, 2)
        self.assertEqual(ActivityEvent.objects.get(kind='staff_action').meta['action'], 'Lunas: Bisnis, kode diterbitkan')
        self.assertEqual(self.web.get(reverse('admin:invitations_payment_changelist')).status_code, 403)
        self.assertEqual(self.web.get(reverse('admin:invitations_payment_add')).status_code, 403)

    def test_invalid_amount_shows_the_form_again(self):
        self.staff('pemilik', superuser=True)
        res = self.web.post(self.url, {'action': 'fulfill_premium', '_selected_action': [self.inv.pk], 'apply': '1',
                                       'amount': '-5', 'channel': 'transfer'})
        self.assertEqual(res.status_code, 200)
        self.assertFalse(Payment.objects.exists())

    def test_staff_cannot_delete_or_see_payments_in_the_group(self):
        perms = set(Group.objects.get(name='Staf').permissions.values_list('codename', flat=True))
        self.assertIn('add_payment', perms)
        self.assertNotIn('view_payment', perms)
        self.assertFalse(any(p.startswith('delete_') for p in perms))


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


@override_settings(ADMIN_REQUIRE_OTP=False)
class InvitationListTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.web = Client()
        helper = User.objects.create_user('bantu', password=PASSWORD, is_staff=True)
        helper.groups.add(Group.objects.get(name='Staf'))
        self.web.force_login(helper)
        self.url = reverse('admin:invitations_invitation_changelist')

    def slugs(self, **query):
        res = self.web.get(self.url, query)
        self.assertEqual(res.status_code, 200)
        return sorted(inv.slug for inv in res.context['cl'].result_list)

    def test_status_filter(self):
        today = timezone.localdate()
        self.make_invitation(slug='aktif')
        self.make_invitation(slug='draf', active=False)
        self.make_invitation(slug='minta', active=False, activation_requested=True)
        old = self.make_invitation(slug='lewat', wedding_date=today - timedelta(days=200))
        self.assertLess(old.expires_at, today)
        self.assertEqual(self.slugs(status='live'), ['aktif'])
        self.assertEqual(self.slugs(status='draft'), ['draf'])
        self.assertEqual(self.slugs(status='requested'), ['minta'])
        self.assertEqual(self.slugs(status='expired'), ['lewat'])

    def test_counts_do_not_multiply(self):
        inv = self.make_invitation(slug='hitung')
        for i in range(3):
            Guest.objects.create(invitation=inv, name=f'T{i}', open_count=2)
        Event.objects.create(invitation=inv, event_type='akad', start=timezone.now(), venue_name='M', address='-')
        res = self.web.get(self.url)
        row = res.context['cl'].result_list[0]
        self.assertEqual((row.n_guests, row.n_opens, row.n_events, row.n_photos), (3, 6, 1, 0))
        self.assertContains(res, 'kurang: foto')

    def test_extend_expiry_and_watermark_actions(self):
        inv = self.make_invitation(slug='perpanjang')
        before = inv.expires_at
        self.web.post(self.url, {'action': 'extend_expiry', '_selected_action': [inv.pk]})
        self.web.post(self.url, {'action': 'remove_watermark', '_selected_action': [inv.pk]})
        inv.refresh_from_db()
        self.assertEqual(inv.expires_at, before + timedelta(days=30))
        self.assertFalse(inv.watermark)
        self.assertEqual(ActivityEvent.objects.filter(kind='staff_action', invitation=inv).count(), 2)


@override_settings(ADMIN_REQUIRE_OTP=False)
class CouplesPageTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.web = Client()
        self.couple = self.make_user('rani', email='rani@example.com')
        self.profile = CoupleProfile.objects.create(user=self.couple, whatsapp='081234567890')
        inv = self.make_invitation(owner=self.couple, slug='rani-dimas')
        Payment.objects.create(invitation=inv, tier='premium', amount=99000)
        User.objects.create_user('staf-lain', password=PASSWORD, is_staff=True)   # staff aren't couples
        self.url = reverse('admin:invitations_coupleprofile_changelist')

    def login(self, superuser):
        user = User.objects.create_user('masuk', password=PASSWORD, is_staff=True, is_superuser=superuser)
        if not superuser:
            user.groups.add(Group.objects.get(name='Staf'))
        self.web.force_login(user)

    def test_owner_sees_payments_and_invitations(self):
        self.login(superuser=True)
        res = self.web.get(self.url)
        self.assertEqual([p.user.username for p in res.context['cl'].result_list], ['rani'])
        self.assertContains(res, 'rani-dimas')
        self.assertContains(res, 'Rp 99.000')

    def test_staff_do_not_see_payments_or_make_reset_links(self):
        self.login(superuser=False)
        res = self.web.get(self.url)
        self.assertNotContains(res, '99.000')
        self.assertNotIn('make_reset_link', dict(res.context['action_form'].fields['action'].choices))
        res = self.web.post(self.url, {'action': 'make_reset_link', '_selected_action': [self.profile.pk]})
        self.assertNotContains(res, 'reset-password?uid=', status_code=res.status_code)

    def test_reset_link_works_once(self):
        self.login(superuser=True)
        res = self.web.post(self.url, {'action': 'make_reset_link', '_selected_action': [self.profile.pk]})
        link = res.context['rows'][0]['link']
        self.assertIn('wa.me/6281234567890', res.context['rows'][0]['wa'])
        from urllib.parse import parse_qs, urlsplit
        q = parse_qs(urlsplit(link).query)
        ok = self.client.post('/api/auth/password-reset-confirm/', {
            'uid': q['uid'][0], 'token': q['token'][0], 'password': 'An0ther-Strong-pass'}, format='json')
        self.assertEqual(ok.status_code, 200)
        again = self.client.post('/api/auth/password-reset-confirm/', {
            'uid': q['uid'][0], 'token': q['token'][0], 'password': 'Yet-An0ther-pass'}, format='json')
        self.assertEqual(again.status_code, 400)
        self.assertTrue(ActivityEvent.objects.filter(kind='staff_action', meta__action='Tautan reset sandi dibuat').exists())


@override_settings(ADMIN_REQUIRE_OTP=False)
class ModerationTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.web = Client()
        helper = User.objects.create_user('bantu', password=PASSWORD, is_staff=True)
        helper.groups.add(Group.objects.get(name='Staf'))
        self.web.force_login(helper)
        self.inv = self.make_invitation(slug='dilapor')

    def test_report_takedown_and_restore(self):
        from apps.invitations.models import AbuseReport
        url = reverse('admin:invitations_abusereport_changelist')
        report = AbuseReport.objects.create(invitation=self.inv, url='https://x/dilapor', reason='impersonation')
        res = self.web.get(reverse('admin:index'))
        self.assertEqual({k['label']: k['value'] for k in res.context['kpis']}['Laporan baru'], 1)

        self.web.post(url, {'action': 'take_down', '_selected_action': [report.pk]})
        report.refresh_from_db()
        self.inv.refresh_from_db()
        self.assertEqual(report.status, 'takedown')
        self.assertFalse(self.inv.is_active)
        self.assertIsNotNone(report.decided_at)

        self.web.post(url, {'action': 'restore', '_selected_action': [report.pk]})
        self.inv.refresh_from_db()
        self.assertTrue(self.inv.is_active)

    def test_reports_are_pruned_after_a_year(self):
        from django.core.management import call_command
        from apps.invitations.models import AbuseReport
        old = AbuseReport.objects.create(url='a', reason='spam')
        AbuseReport.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=366))
        AbuseReport.objects.create(url='b', reason='spam')
        call_command('purge_expired', stdout=open('/dev/null', 'w'))
        self.assertEqual(list(AbuseReport.objects.values_list('url', flat=True)), ['b'])

    def test_staff_hide_a_wish(self):
        from apps.invitations.models import RSVP
        rsvp = RSVP.objects.create(invitation=self.inv, guest_name='X', attending=True, wishes='kasar')
        self.web.post(reverse('admin:invitations_rsvp_changelist'), {'action': 'hide_wishes', '_selected_action': [rsvp.pk]})
        rsvp.refresh_from_db()
        self.assertEqual(rsvp.wish_status, 'hidden')
