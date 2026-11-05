"""Observability: health checks, request ids in logs, and an exception full of
personal data reaching the error tracker with all of it scrubbed."""
import json
import logging
from datetime import timedelta
from io import StringIO
from unittest import mock

import sentry_sdk
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from sentry_sdk.transport import Transport

from apps.invitations import ops
from config import sentry as sentry_config
from config.logging import JSONFormatter, RequestIdFilter

from .base import APITestBase

PII = ['Budi Santoso', '081234567890', 'budi@example.com', 'Jl. Mawar No. 3', 'K7MPQ2']


class CapturingTransport(Transport):
    def __init__(self, options=None):
        super().__init__(options)
        self.events = []

    def capture_envelope(self, envelope):
        for item in envelope.items:
            if item.headers.get('type') in ('event', 'transaction'):
                self.events.append(item.payload.json)


class SentryScrubbingTests(APITestBase):
    def tearDown(self):
        sentry_sdk.init(dsn=None)   # leave the SDK off for other tests
        super().tearDown()

    def test_pii_laden_exception_reaches_sentry_scrubbed(self):
        transport = CapturingTransport()
        sentry_config.init('https://public@o1.ingest.sentry.io/1', 'test-sha', 'test', transport=transport)
        self.make_invitation(slug='andini-bagus')
        boom = ValueError(f'Gagal untuk {PII[0]} {PII[1]} {PII[2]} di {PII[3]}, link /andini-bagus/{PII[4]}')
        self.client.raise_request_exception = False
        with mock.patch('apps.invitations.views.InvitationDetailView.retrieve', side_effect=boom):
            res = self.client.get('/api/invitations/andini-bagus/?to=Budi%20Santoso&g=K7MPQ2',
                                  HTTP_COOKIE='dg_access=eyJhbGciOiJIUzI1NiJ9.eyJ1IjoxfQ.sig; csrftoken=abc')
        self.assertEqual(res.status_code, 500)
        sentry_sdk.flush()
        events = [e for e in transport.events if e.get('exception')]
        self.assertEqual(len(events), 1)
        sent = json.dumps(events[0])
        for secret in PII + ['eyJhbGci', 'Budi%20Santoso', 'csrftoken=abc']:
            self.assertNotIn(secret, sent, secret)
        self.assertEqual(events[0]['release'], 'test-sha')
        self.assertIn('ValueError', sent)   # still useful: type and code location


class LoggingTests(APITestBase):
    def test_json_lines_carry_request_id_and_no_pii(self):
        stream = StringIO()
        handler = logging.StreamHandler(stream)
        handler.setFormatter(JSONFormatter())
        handler.addFilter(RequestIdFilter())
        log = logging.getLogger('dearguest.test')
        log.addHandler(handler)
        try:
            res = self.client.get('/api/health/', HTTP_X_REQUEST_ID='req-12345678')
            self.assertEqual(res['X-Request-ID'], 'req-12345678')
            from config.logging import request_id
            token = request_id.set('req-12345678')
            log.warning('kirim ke %s gagal', PII[1], extra={'guest_name': PII[0], 'count': 2})
            request_id.reset(token)
        finally:
            log.removeHandler(handler)
        line = json.loads(stream.getvalue())
        self.assertEqual((line['request_id'], line['count']), ('req-12345678', 2))
        self.assertNotIn(PII[0], stream.getvalue())
        self.assertNotIn(PII[1], stream.getvalue())

    def test_bad_incoming_request_ids_are_replaced(self):
        res = self.client.get('/api/health/', HTTP_X_REQUEST_ID='<script>')
        self.assertRegex(res['X-Request-ID'], r'^[0-9a-f]{32}$')


@override_settings(HEALTH_TOKEN='rahasia-health')
class HealthTests(APITestBase):
    def deep(self):
        return self.client.get('/api/health/?deep=1', HTTP_X_HEALTH_TOKEN='rahasia-health')

    def test_basic_checks(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'ok')

    def test_deep_check_needs_the_token(self):
        self.assertEqual(self.client.get('/api/health/?deep=1').status_code, 403)
        self.assertEqual(self.client.get('/api/health/?deep=1&token=salah').status_code, 403)

    @mock.patch('apps.invitations.health.shutil.disk_usage', return_value=mock.Mock(total=100, used=40))
    def test_silent_jobs_and_expiring_certificates_fail_the_deep_check(self, _disk):
        res = self.deep()
        self.assertEqual(res.status_code, 503)
        self.assertIn('backup: never', res.json()['checks']['jobs']['error'])
        for job in ('backup', 'purge', 'cert_check'):
            ops.heartbeat(job)
        cache.set('ops:cert_days', 60)
        self.assertEqual(self.deep().json()['status'], 'ok')
        cache.set('ops:cert_days', 10)
        self.assertEqual(self.deep().status_code, 503)
        cache.set('ops:cert_days', 60)
        cache.set(ops.PREFIX + 'backup', (timezone.now() - timedelta(hours=27)).isoformat(), None)
        res = self.deep()
        self.assertEqual(res.status_code, 503)
        self.assertIn('backup', res.json()['checks']['jobs']['error'])

    def test_full_disk_fails(self):
        with mock.patch('apps.invitations.health.shutil.disk_usage', return_value=mock.Mock(total=100, used=85)):
            for job in ('backup', 'purge', 'cert_check'):
                ops.heartbeat(job)
            cache.set('ops:cert_days', 60)
            res = self.deep()
        self.assertEqual(res.json()['checks']['disk']['ok'], False)

    def test_database_down_is_503(self):
        with mock.patch('apps.invitations.health._db', side_effect=Exception('down')):
            res = self.client.get('/api/health/')
        self.assertEqual((res.status_code, res.json()['status']), (503, 'fail'))
