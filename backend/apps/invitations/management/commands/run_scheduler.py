"""The scheduler service (docker-compose.prod.yml): runs the periodic jobs in
one long-lived process, in WIB. Last runs are kept in Redis, so a restart
doesn't repeat or skip a day.

    02:15  backup        ops/backup.sh
    03:30  purge         manage.py purge_expired
    every 6 h cert_check ops/cert-check.sh
A job that exits non-zero is reported (ops_report ... fail)."""
import subprocess
import time
from datetime import datetime, time as dtime, timedelta
from zoneinfo import ZoneInfo

from django.core.cache import cache
from django.core.management.base import BaseCommand

TZ = ZoneInfo('Asia/Jakarta')
JOBS = [
    ('backup', ('daily', dtime(2, 15)), ['/app/ops/backup.sh'], 3600),
    ('purge', ('daily', dtime(3, 30)), ['python', 'manage.py', 'purge_expired'], 1800),
    ('cert_check', ('every', timedelta(hours=6)), ['/app/ops/cert-check.sh'], 120),
]


def due(rule, now, last):
    kind, value = rule
    if kind == 'daily':
        slot = now.replace(hour=value.hour, minute=value.minute, second=0, microsecond=0)
        return now >= slot and (last is None or last < slot)
    return last is None or now - last >= value


class Command(BaseCommand):
    help = 'Run the scheduled ops jobs forever.'

    def add_arguments(self, parser):
        parser.add_argument('--once', help='Run one job now and exit (e.g. --once backup).')

    def run(self, name, cmd, timeout):
        self.stdout.write(f'{datetime.now(TZ):%Y-%m-%d %H:%M} running {name}')
        try:
            code = subprocess.run(cmd, timeout=timeout, cwd='/app').returncode
        except subprocess.TimeoutExpired:
            code = 'timeout'
        if code != 0 and name != 'backup':   # backup.sh reports its own failures
            subprocess.run(['python', 'manage.py', 'ops_report', name, 'fail', '--detail', f'exit {code}'], cwd='/app')
        return code

    def handle(self, once=None, **options):
        jobs = {name: (rule, cmd, timeout) for name, rule, cmd, timeout in JOBS}
        if once:
            _, cmd, timeout = jobs[once]
            raise SystemExit(0 if self.run(once, cmd, timeout) == 0 else 1)
        while True:
            now = datetime.now(TZ)
            for name, (rule, cmd, timeout) in jobs.items():
                raw = cache.get(f'ops:sched:{name}')
                last = datetime.fromisoformat(raw) if raw else None
                if due(rule, now, last):
                    cache.set(f'ops:sched:{name}', now.isoformat(), timeout=None)
                    self.run(name, cmd, timeout)
            time.sleep(30)
