"""Sessions live in httpOnly cookies: no tokens in response bodies, CSRF on
unsafe methods, rotating refresh tokens, logout and password reset revoke."""
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.test import override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from apps.auth_api.cookies import ACCESS_COOKIE, REFRESH_COOKIE

from .base import APITestBase

PASSWORD = 'x-Strong-pass-91'


class CookieSessionTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user('andini', email='a@example.com', password=PASSWORD)
        self.inv = self.make_invitation(owner=self.user)
        self.client = APIClient(enforce_csrf_checks=True)

    def login(self, client=None):
        client = client or self.client
        return client.post('/api/auth/login/', {'username': 'andini', 'password': PASSWORD}, format='json')

    def csrf(self, client=None):
        return {'HTTP_X_CSRFTOKEN': (client or self.client).cookies['csrftoken'].value}

    def test_login_sets_httponly_cookies_and_returns_no_tokens(self):
        res = self.login()
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {'username': 'andini'})
        for name, path in ((ACCESS_COOKIE, '/'), (REFRESH_COOKIE, '/api/auth/')):
            cookie = res.cookies[name]
            self.assertTrue(cookie['httponly'], name)
            self.assertEqual(cookie['samesite'], 'Lax')
            self.assertEqual(cookie['path'], path)
        self.assertIn('csrftoken', res.cookies)
        self.assertNotIn('access', res.content.decode())

    @override_settings(AUTH_COOKIE_SECURE=True)
    def test_cookies_are_secure_outside_development(self):
        res = self.login()
        self.assertTrue(res.cookies[ACCESS_COOKIE]['secure'])
        self.assertTrue(res.cookies[REFRESH_COOKIE]['secure'])

    def test_reads_work_and_writes_need_the_csrf_header(self):
        self.login()
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 200)
        url = f'/api/my/invitations/{self.inv.slug}/'
        self.assertEqual(self.client.patch(url, {'dress_code': 'Batik'}, format='json').status_code, 403)
        res = self.client.patch(url, {'dress_code': 'Batik'}, format='json', **self.csrf())
        self.assertEqual(res.status_code, 200)

    def test_bearer_headers_are_no_longer_accepted(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.user).access_token
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(client.get('/api/auth/me/').status_code, 401)

    def test_refresh_rotates_and_the_old_refresh_token_is_dead(self):
        self.login()
        old = self.client.cookies[REFRESH_COOKIE].value
        res = self.client.post('/api/auth/refresh/')
        self.assertEqual(res.status_code, 204)
        self.assertNotEqual(res.cookies[REFRESH_COOKIE].value, old)
        thief = APIClient()
        thief.cookies[REFRESH_COOKIE] = old
        self.assertEqual(thief.post('/api/auth/refresh/').status_code, 401)

    def test_expired_access_cookie_is_anonymous_not_an_error(self):
        self.client.cookies[ACCESS_COOKIE] = 'not-a-jwt'
        self.assertEqual(self.client.get(f'/api/invitations/{self.inv.slug}/').status_code, 200)
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_logout_blacklists_and_clears(self):
        self.login()
        refresh = self.client.cookies[REFRESH_COOKIE].value
        res = self.client.post('/api/auth/logout/')
        self.assertEqual(res.status_code, 204)
        self.assertEqual(res.cookies[ACCESS_COOKIE].value, '')
        replay = APIClient()
        replay.cookies[REFRESH_COOKIE] = refresh
        self.assertEqual(replay.post('/api/auth/refresh/').status_code, 401)

    def test_register_logs_in_with_cookies(self):
        res = APIClient().post('/api/auth/register/', {
            'username': 'bagus', 'email': 'b@example.com', 'password': PASSWORD, 'whatsapp': '081234567890',
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data, {'username': 'bagus'})
        self.assertIn(ACCESS_COOKIE, res.cookies)

    def test_password_reset_revokes_every_session(self):
        phone, laptop = APIClient(), APIClient()
        self.login(phone)
        self.login(laptop)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        res = APIClient().post('/api/auth/password-reset-confirm/',
                               {'uid': uid, 'token': token, 'password': 'An0ther-Strong-pass'}, format='json')
        self.assertEqual(res.status_code, 200)
        for client in (phone, laptop):
            self.assertEqual(client.post('/api/auth/refresh/').status_code, 401)
