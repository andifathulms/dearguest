"""Report a scheduled job's result: success records a heartbeat (checked by
/api/health/?deep=1); failure alerts the Telegram bot, and for backups also
email. Messages carry the job and step only, never data.

    python manage.py ops_report backup ok --detail "db 1234 bytes"
    python manage.py ops_report backup fail --detail "step: upload"
    python manage.py ops_report cert_check ok --cert-days 63"""
import json
import logging
import urllib.request

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.management.base import BaseCommand

from apps.invitations import ops

log = logging.getLogger('dearguest.ops')


def telegram(text):
    token, chat = settings.TELEGRAM_BOT_TOKEN, settings.TELEGRAM_CHAT_ID
    if not (token and chat):
        return False
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=json.dumps({'chat_id': chat, 'text': text}).encode(), headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req, timeout=10).read()
        return True
    except OSError:
        log.exception('telegram alert failed')
        return False


class Command(BaseCommand):
    help = 'Record a scheduled job result and alert on failure.'

    def add_arguments(self, parser):
        parser.add_argument('job')
        parser.add_argument('status', choices=['ok', 'fail'])
        parser.add_argument('--detail', default='')
        parser.add_argument('--cert-days', type=int)

    def handle(self, job, status, detail='', cert_days=None, **options):
        if cert_days is not None:
            cache.set('ops:cert_days', cert_days, timeout=None)
        if status == 'ok':
            ops.heartbeat(job)
            log.info('job ok', extra={'ops_job': job, 'ops_detail': detail})
            return
        text = f'⚠️ DearGuest {settings.RELEASE}: job "{job}" GAGAL ({detail}). Lihat RUNBOOK.md.'
        log.error('job failed', extra={'ops_job': job, 'ops_detail': detail})
        telegram(text)
        if job == 'backup':
            send_mail('[DearGuest] Backup gagal', text, settings.DEFAULT_FROM_EMAIL, [settings.ADMIN_EMAIL], fail_silently=True)
