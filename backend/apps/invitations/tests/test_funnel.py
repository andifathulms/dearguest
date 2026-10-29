"""Marketing funnel: anonymous weekly counts per step and UTM source."""
from datetime import date

from apps.invitations.models import FunnelEvent

from .base import APITestBase

UTM = {'utm_source': 'invitation', 'utm_medium': 'watermark', 'utm_campaign': 'a1b2c3d4'}


class FunnelTests(APITestBase):
    def test_visit_register_onboarded_are_counted_with_their_source(self):
        self.client.post('/api/funnel/visit/', {'utm': UTM}, format='json', HTTP_USER_AGENT='Mozilla/5.0')
        res = self.client.post('/api/auth/register/', {
            'username': 'andini', 'email': 'a@example.com', 'password': 'x-Strong-pass-91',
            'whatsapp': '081234567890', 'utm': UTM,
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        # Registration logged the client in with cookies.
        res = self.client.post('/api/my/invitations/', {
            'slug': 'andini-bagus', 'theme': 'sage', 'wedding_date': '2026-12-12', 'utm': UTM,
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        steps = list(FunnelEvent.objects.order_by('created_at').values_list('step', 'utm_source', 'utm_campaign'))
        self.assertEqual(steps, [('visit', 'invitation', 'a1b2c3d4'), ('register', 'invitation', 'a1b2c3d4'),
                                 ('onboarded', 'invitation', 'a1b2c3d4')])
        self.assertTrue(all(e.week.weekday() == 0 for e in FunnelEvent.objects.all()))

    def test_no_personal_fields_and_junk_is_dropped(self):
        fields = {f.name for f in FunnelEvent._meta.get_fields()}
        self.assertEqual(fields, {'id', 'step', 'utm_source', 'utm_medium', 'utm_campaign', 'week', 'created_at'})
        self.client.post('/api/funnel/visit/', {'utm': {'utm_source': 'x' * 500, 'evil': 'y'}}, format='json')
        self.client.post('/api/funnel/visit/', {'utm': 'not-a-dict'}, format='json')
        sources = list(FunnelEvent.objects.values_list('utm_source', flat=True))
        self.assertEqual(sorted(len(s) for s in sources), [0, 100])

    def test_bots_are_not_visits(self):
        self.client.post('/api/funnel/visit/', {}, format='json', HTTP_USER_AGENT='Googlebot/2.1')
        self.assertFalse(FunnelEvent.objects.exists())

    def test_admin_weekly_table(self):
        FunnelEvent.objects.create(step='visit', week=date(2026, 10, 26))
        self.client.force_login(self.make_user('staff', is_staff=True, is_superuser=True))
        res = self.client.get('/admin/invitations/funnelevent/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Per minggu')
