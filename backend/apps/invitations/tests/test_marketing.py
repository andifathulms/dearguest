from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from apps.invitations.models import Plan, Testimonial


class MarketingEndpointTests(TestCase):
    url = '/api/site/marketing/'

    def setUp(self):
        self.client = APIClient()

    def test_migration_seeds_todays_three_plans_in_order(self):
        data = self.client.get(self.url).json()
        self.assertEqual([p['slug'] for p in data['plans']], ['gratis', 'premium', 'bisnis'])
        premium = data['plans'][1]
        self.assertEqual((premium['price'], premium['compare_at_price']), (99000, 199000))
        self.assertTrue(premium['is_featured'])
        self.assertIn('Tanpa watermark', premium['features'])

    def test_inactive_plans_are_hidden(self):
        Plan.objects.filter(slug='bisnis').update(is_active=False)
        slugs = [p['slug'] for p in self.client.get(self.url).json()['plans']]
        self.assertNotIn('bisnis', slugs)

    def test_compare_price_only_when_higher(self):
        # A "was" price at or below today's price is never shown struck through.
        Plan.objects.filter(slug='premium').update(compare_at_price=99000)
        premium = next(p for p in self.client.get(self.url).json()['plans'] if p['slug'] == 'premium')
        self.assertIsNone(premium['compare_at_price'])

    def test_only_published_testimonials_with_theme_name(self):
        Testimonial.objects.create(names='A & B', quote='Bagus', theme='sage', is_published=True)
        Testimonial.objects.create(names='C & D', quote='Draft', is_published=False)
        Testimonial.objects.create(names='E & F', quote='Old theme', theme='no-such-theme', is_published=True)
        rows = self.client.get(self.url).json()['testimonials']
        self.assertEqual([r['names'] for r in rows], ['A & B', 'E & F'])
        self.assertEqual(rows[0]['theme_name'], 'Taman Sage')
        self.assertEqual(rows[1]['theme'], '')   # unknown theme: no cover

    def test_public_read_only(self):
        self.assertEqual(self.client.post(self.url, {}).status_code, 405)


class SeedMarketingTests(TestCase):
    def test_samples_are_unpublished_by_default_and_idempotent(self):
        call_command('seed_marketing', '--sample-testimonials', stdout=open('/dev/null', 'w'))
        call_command('seed_marketing', '--sample-testimonials', stdout=open('/dev/null', 'w'))
        self.assertEqual(Testimonial.objects.count(), 3)
        self.assertFalse(Testimonial.objects.filter(is_published=True).exists())
        self.assertTrue(all(t.is_sample for t in Testimonial.objects.all()))

    def test_publish_flag(self):
        call_command('seed_marketing', '--sample-testimonials', '--publish', stdout=open('/dev/null', 'w'))
        self.assertEqual(Testimonial.objects.filter(is_published=True).count(), 3)


class InvitationProgressTests(TestCase):
    def test_checklist_follows_what_the_couple_filled_in(self):
        from datetime import date
        from django.contrib.auth.models import User
        from apps.invitations.models import Couple, Invitation
        user = User.objects.create_user('pasangan', password='rahasia-123')
        inv = Invitation.objects.create(slug='rani-dimas', theme='sage', wedding_date=date(2027, 1, 9), couple_user=user)
        Couple.objects.create(invitation=inv, bride_name='Rani', groom_name='Dimas', bride_parents='', groom_parents='')
        client = APIClient()
        client.force_authenticate(user)
        row = client.get('/api/my/invitations/').json()['invitations'][0]
        done = {step['key']: step['done'] for step in row['progress']}
        self.assertEqual(done, {'couple': True, 'events': False, 'photos': False, 'guests': False, 'active': False})
