"""p0-4: public wishes, RSVP posting and the OG share page respect is_active
and expiry; the owner's preview keeps working for drafts."""
from datetime import date, timedelta

from django.contrib.auth.models import User

from apps.invitations.models import RSVP

from .base import APITestBase

PAST = date.today() - timedelta(days=200)  # + 90-day grace = already expired


class PublicStatusBase(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.live = self.make_invitation(owner=self.owner, slug='live')
        self.draft = self.make_invitation(owner=self.owner, slug='draft', active=False)
        self.expired = self.make_invitation(owner=self.owner, slug='expired', wedding_date=PAST)
        for inv in (self.live, self.draft, self.expired):
            RSVP.objects.create(invitation=inv, guest_name='Budi', attending=True, wishes='Selamat!')


class WishesTests(PublicStatusBase):
    def test_hidden_or_missing_invitations_404(self):
        for slug in ('draft', 'expired', 'nope'):
            with self.subTest(slug=slug):
                self.assertEqual(self.client.get(f'/api/invitations/{slug}/wishes/').status_code, 404)

    def test_list_is_paginated_newest_first(self):
        RSVP.objects.filter(invitation=self.live).delete()
        for i in range(25):
            RSVP.objects.create(invitation=self.live, guest_name=f'Tamu {i:02d}', attending=True, wishes='Doa')
        res = self.client.get('/api/invitations/live/wishes/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['count'], 25)
        self.assertEqual(len(res.data['results']), 20)
        self.assertIsNotNone(res.data['next'])
        self.assertEqual(res.data['results'][0]['guest_name'], 'Tamu 24')
        page2 = self.client.get('/api/invitations/live/wishes/?page=2')
        self.assertEqual(len(page2.data['results']), 5)

    def test_owner_preview_can_read_draft_wishes(self):
        self.login(self.owner)
        res = self.client.get('/api/invitations/draft/wishes/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['count'], 1)

    def test_other_users_cannot_read_draft_wishes(self):
        self.login(self.make_user('stranger'))
        self.assertEqual(self.client.get('/api/invitations/draft/wishes/').status_code, 404)


class RSVPPostTests(PublicStatusBase):
    def post(self, slug):
        return self.client.post(f'/api/invitations/{slug}/rsvp/', {
            'guest_name': 'Sari', 'attending': True, 'pax': 2, 'wishes': 'Barakallah',
        }, format='json')

    def test_posting_to_hidden_or_missing_invitations_404(self):
        for slug in ('draft', 'expired', 'nope'):
            with self.subTest(slug=slug):
                self.assertEqual(self.post(slug).status_code, 404)

    def test_posting_to_a_live_invitation_works(self):
        self.assertEqual(self.post('live').status_code, 201)


class ShareTests(PublicStatusBase):
    def test_live_invitation_has_couple_og_tags(self):
        res = self.client.get('/share/live/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Andini')

    def test_hidden_or_missing_invitations_get_a_generic_404(self):
        for slug in ('draft', 'expired', 'nope'):
            with self.subTest(slug=slug):
                res = self.client.get(f'/share/{slug}/?to=Budi')
                self.assertEqual(res.status_code, 404)
                body = res.content.decode()
                self.assertIn('og:title', body)
                self.assertNotIn('Andini', body)
                self.assertNotIn('Bagus', body)
                self.assertNotIn('og:image', body)

    def test_share_script_redirect_cannot_break_out_of_the_script_tag(self):
        res = self.client.get('/share/live/?to=%3C/script%3E%3Cscript%3Ealert(1)%3C/script%3E')
        self.assertNotIn('</script><script>alert(1)', res.content.decode())


class PreviewTests(PublicStatusBase):
    def test_owner_preview_endpoint_still_serves_a_draft(self):
        self.login(self.owner)
        res = self.client.get('/api/my/invitations/draft/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['slug'], 'draft')

    def test_staff_can_read_any_draft_wishes(self):
        staff = User.objects.create_user('staff', password='x-Strong-pass-91', is_staff=True)
        self.login(staff)
        self.assertEqual(self.client.get('/api/invitations/draft/wishes/').status_code, 200)
