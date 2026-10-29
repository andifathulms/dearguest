"""Ownership sweep: one couple can never read or change another couple's data.

Every URL pattern the site serves must be classified in OWNERSHIP below; a
new endpoint without a classification fails `test_every_endpoint_is_classified`,
so it can't ship without someone deciding who may use it. Every `owner`
endpoint is then tried with every method by a stranger (another logged-in
couple) and anonymously, and must answer 401/403/404 and change nothing."""
from datetime import datetime, timezone

from django.contrib.auth.models import User
from django.urls import URLResolver, get_resolver

from apps.invitations.models import RSVP, BankAccount, Event, Guest, MusicPreset, Photo, Story

from .base import APITestBase, mp3_upload, png_upload

DENIED = {401, 403, 404}
NOT_ALLOWED = 405   # the endpoint has no such method: nothing happens either
A = 'milik-andini'

# pattern -> who may use it. `owner` patterns list (method, url) cases tried
# by strangers; {slug}, {guest}, {rsvp}, {event}, {story}, {photo}, {bank}
# and {code} are filled from couple A's data.
OWNERSHIP = {
    # Public guest-facing pages: drafts are hidden from everyone but the owner
    # (checked in test_public_endpoints_hide_drafts).
    'api/invitations/<slug:slug>/': 'public',
    'api/invitations/<slug:slug>/rsvp/': 'public',
    'api/invitations/<slug:slug>/guest/<str:code>/': 'public',
    'api/invitations/<slug:slug>/guest/<str:code>/open/': 'public',
    'api/invitations/<slug:slug>/wishes/': 'public',
    'api/invitations/<slug:slug>/events/<int:pk>/calendar.ics': 'public',
    'share/<slug:slug>/': 'public',
    r'^og/(?P<slug>[-\w]+)/(?P<digest>[0-9a-f]{16})\.jpg$': 'public',
    r'^og/(?P<slug>[-\w]+)/(?P<code>[A-Za-z0-9]{4,12})/(?P<digest>[0-9a-f]{16})\.jpg$': 'public',
    r'^(?!(?:admin|api|media|share|og|static)(?:/|$))(?P<slug>[-\w]+)/?$': 'public',
    r'^(?!(?:admin|api|media|share|og|static)(?:/|$))(?P<slug>[-\w]+)/(?P<code>[A-Za-z0-9]{4,12})/?$': 'public',
    # Site-wide, no couple data.
    'api/funnel/visit/': 'public',
    'api/coupons/validate/': 'public',
    'api/music-presets/': 'public',
    r'^media/(?P<path>.*)$': 'debug-only',   # Django serves media only with DEBUG; nginx in prod
    'api/auth/login/': 'public',
    'api/auth/refresh/': 'public',
    'api/auth/logout/': 'public',
    'api/auth/register/': 'public',
    'api/auth/password-reset/': 'public',
    'api/auth/password-reset-confirm/': 'public',
    # The caller's own account / own list only.
    'api/auth/me/': 'self',
    'api/my/slug-check/': 'self',
    'api/my/invitations/': 'self',
    # One couple's data.
    'api/invitations/<slug:slug>/rsvps/': ('owner', [('get', '/api/invitations/{slug}/rsvps/')]),
    'api/invitations/<slug:slug>/rsvps.csv': ('owner', [('get', '/api/invitations/{slug}/rsvps.csv')]),
    'api/invitations/<slug:slug>/guests/': ('owner', [
        ('get', '/api/invitations/{slug}/guests/'),
        ('post', '/api/invitations/{slug}/guests/'),
    ]),
    'api/invitations/<slug:slug>/guests/import/': ('owner', [('post', '/api/invitations/{slug}/guests/import/')]),
    'api/invitations/<slug:slug>/guests/<int:pk>/': ('owner', [
        ('get', '/api/invitations/{slug}/guests/{guest}/'),
        ('patch', '/api/invitations/{slug}/guests/{guest}/'),
        ('put', '/api/invitations/{slug}/guests/{guest}/'),
        ('delete', '/api/invitations/{slug}/guests/{guest}/'),
    ]),
    'api/my/invitations/<slug:slug>/': ('owner', [
        ('get', '/api/my/invitations/{slug}/'),
        ('patch', '/api/my/invitations/{slug}/'),
        ('delete', '/api/my/invitations/{slug}/'),
    ]),
    'api/my/invitations/<slug:slug>/request-activation/': ('owner', [('post', '/api/my/invitations/{slug}/request-activation/')]),
    'api/my/invitations/<slug:slug>/activate/': ('owner', [('post', '/api/my/invitations/{slug}/activate/')]),
    'api/my/invitations/<slug:slug>/music-preset/': ('owner', [
        ('post', '/api/my/invitations/{slug}/music-preset/'),
        ('put', '/api/my/invitations/{slug}/music-preset/'),
        ('delete', '/api/my/invitations/{slug}/music-preset/'),
    ]),
    'api/my/invitations/<slug:slug>/couple/': ('owner', [
        ('get', '/api/my/invitations/{slug}/couple/'),
        ('put', '/api/my/invitations/{slug}/couple/'),
        ('patch', '/api/my/invitations/{slug}/couple/'),
    ]),
    'api/my/invitations/<slug:slug>/wishes/': ('owner', [('get', '/api/my/invitations/{slug}/wishes/')]),
    'api/my/invitations/<slug:slug>/wishes/<int:pk>/': ('owner', [
        ('patch', '/api/my/invitations/{slug}/wishes/{rsvp}/'),
        ('delete', '/api/my/invitations/{slug}/wishes/{rsvp}/'),
    ]),
    **{
        f'api/my/invitations/<slug:slug>/{name}/': ('owner', [
            ('get', f'/api/my/invitations/{{slug}}/{name}/'),
            ('post', f'/api/my/invitations/{{slug}}/{name}/'),
        ])
        for name in ('events', 'stories', 'photos', 'bank-accounts')
    },
    **{
        f'api/my/invitations/<slug:slug>/{name}/<int:pk>/': ('owner', [
            ('get', f'/api/my/invitations/{{slug}}/{name}/{{{key}}}/'),
            ('patch', f'/api/my/invitations/{{slug}}/{name}/{{{key}}}/'),
            ('put', f'/api/my/invitations/{{slug}}/{name}/{{{key}}}/'),
            ('delete', f'/api/my/invitations/{{slug}}/{name}/{{{key}}}/'),
        ])
        for name, key in (('events', 'event'), ('stories', 'story'), ('photos', 'photo'), ('bank-accounts', 'bank'))
    },
}
# Phase 3 (payments) adds orders and invoices: classify them here as `owner`
# with their cases when they exist.

STAFF_PREFIXES = ('admin/',)


def all_patterns(resolver=None, prefix=''):
    for p in (resolver or get_resolver()).url_patterns:
        route = prefix + str(p.pattern)
        if isinstance(p, URLResolver):
            yield from all_patterns(p, route)
        else:
            yield route


class OwnershipSweep(APITestBase):
    def setUp(self):
        super().setUp()
        self.a = User.objects.create_user('andini', password='x-Strong-pass-91')
        self.b = User.objects.create_user('pengintip', password='x-Strong-pass-91')
        self.inv = self.make_invitation(owner=self.a, slug=A, active=False)
        self.inv.couple.bride_name = 'Andini Rahasia'
        self.inv.couple.save()
        self.make_invitation(owner=self.b, slug='milik-pengintip')
        start = datetime(2026, 12, 12, 1, tzinfo=timezone.utc)
        self.ids = {
            'slug': A,
            'guest': Guest.objects.create(invitation=self.inv, name='Tamu Rahasia', code='K7MPQ2').pk,
            'code': 'K7MPQ2',
            'rsvp': RSVP.objects.create(invitation=self.inv, guest_name='Tamu Rahasia', attending=True, wishes='Doa').pk,
            'event': Event.objects.create(invitation=self.inv, event_type='akad', venue_name='Masjid Rahasia',
                                          address='-', start=start, is_primary=True).pk,
            'story': Story.objects.create(invitation=self.inv, title='Kisah', description='-').pk,
            'photo': Photo.objects.create(invitation=self.inv, image=png_upload()).pk,
            'bank': BankAccount.objects.create(invitation=self.inv, bank_name='BCA', account_number='1234567890',
                                               account_name='Andini').pk,
        }
        self.preset = MusicPreset.objects.create(title='Lagu', audio=mp3_upload())

    def snapshot(self):
        self.inv.refresh_from_db()
        return {
            'inv': (self.inv.is_active, self.inv.dress_code, self.inv.theme, self.inv.music_preset_id, self.inv.activation_requested),
            'couple': (self.inv.couple.bride_name, self.inv.couple.groom_name),
            'counts': [m.objects.filter(invitation=self.inv).count() for m in (Guest, RSVP, Event, Story, Photo, BankAccount)],
            'rsvp': RSVP.objects.get(pk=self.ids['rsvp']).wish_status,
            'photo_file': Photo.objects.get(pk=self.ids['photo']).image.storage.exists(Photo.objects.get(pk=self.ids['photo']).image.name),
        }

    def test_every_endpoint_is_classified(self):
        served = {p for p in all_patterns() if not p.startswith(STAFF_PREFIXES)}
        self.assertEqual(sorted(served - set(OWNERSHIP)), [], 'new endpoint(s) without an ownership classification')
        listed = {p for p, rule in OWNERSHIP.items() if rule != 'debug-only'}
        self.assertEqual(sorted(listed - served), [], 'stale entries: endpoint(s) removed')

    def test_strangers_and_anonymous_get_nothing_and_change_nothing(self):
        payload = {'name': 'x', 'title': 'x', 'description': 'x', 'bank_name': 'x', 'account_number': '1',
                   'account_name': 'x', 'event_type': 'akad', 'venue_name': 'x', 'address': 'x',
                   'start': '2026-12-12T01:00:00Z', 'dress_code': 'Diretas', 'theme': 'floral', 'code': 'ABC123',
                   'preset': self.preset.pk, 'bride_name': 'Diretas', 'wish_status': 'hidden', 'rows': [{'name': 'x'}],
                   'sent_at': '2026-10-28T10:00:00Z'}
        before = self.snapshot()
        for who in ('stranger', 'anonymous'):
            if who == 'stranger':
                self.login(self.b)
            else:
                self.client.force_authenticate(None)
            for pattern, rule in OWNERSHIP.items():
                if not isinstance(rule, tuple):
                    continue
                for method, template in rule[1]:
                    url = template.format(**self.ids)
                    with self.subTest(who=who, method=method, url=url):
                        res = getattr(self.client, method)(url, payload, format='json')
                        self.assertIn(res.status_code, DENIED | {NOT_ALLOWED})
                        self.assertNotIn(b'Rahasia', res.content)
        self.assertEqual(self.snapshot(), before)

    def test_public_endpoints_hide_drafts_from_strangers(self):
        self.login(self.b)
        for url in (f'/api/invitations/{A}/', f'/api/invitations/{A}/wishes/', f'/api/invitations/{A}/guest/K7MPQ2/',
                    f"/api/invitations/{A}/events/{self.ids['event']}/calendar.ics", f'/share/{A}/', f'/{A}', f'/{A}/K7MPQ2'):
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertNotIn(b'Rahasia', res.content)
        res = self.client.post(f'/api/invitations/{A}/rsvp/', {'guest_name': 'x', 'attending': True}, format='json')
        self.assertIn(res.status_code, DENIED)

    def test_self_endpoints_list_only_the_callers_own(self):
        self.login(self.b)
        self.assertNotIn(A, str(self.client.get('/api/my/invitations/').data))
        self.assertNotIn(A, str(self.client.get('/api/auth/me/').data))

    def test_the_owner_still_has_access(self):
        self.login(self.a)
        for url in (f'/api/my/invitations/{A}/', f'/api/invitations/{A}/guests/', f'/api/invitations/{A}/rsvps/',
                    f"/api/my/invitations/{A}/photos/{self.ids['photo']}/"):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)
