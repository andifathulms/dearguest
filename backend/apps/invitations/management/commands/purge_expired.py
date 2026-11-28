"""Daily retention job (scheduler): email couples a week ahead, then delete
guests' personal data RETENTION_DAYS after an invitation expires, and prune
backoffice activity older than activity.KEEP_DAYS and abuse reports after a year.

    python manage.py purge_expired --dry-run   # what would happen, changes nothing
    python manage.py purge_expired

Output and logs carry slugs-free counts only."""
import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.invitations import activity, ops, retention
from apps.invitations.models import AbuseReport

log = logging.getLogger('vowvella.retention')


class Command(BaseCommand):
    help = 'Notify couples and delete guest data after the retention period.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, dry_run=False, **options):
        now = timezone.now()
        today = timezone.localdate()
        notices = list(retention.due_for_notice(today))
        purges = retention.due_for_purge(today, now)
        sent = failed = 0
        totals = {}
        if not dry_run:
            for inv in notices:
                if not retention._has_email(inv):
                    continue
                try:
                    retention.send_notice(inv)
                except Exception:   # one bad address must not stop the run
                    failed += 1
                    log.exception('retention notice failed')
                    continue
                inv.purge_notice_sent_at = now
                inv.save(update_fields=['purge_notice_sent_at'])
                sent += 1
            for inv in purges:
                for key, n in retention.purge(inv).items():
                    totals[key] = totals.get(key, 0) + n
            totals['activity_pruned'] = activity.prune(now)
            totals['reports_pruned'] = AbuseReport.objects.filter(
                created_at__lt=now - timedelta(days=AbuseReport.KEEP_DAYS)).delete()[0]
            ops.heartbeat('purge')
        summary = {'dry_run': dry_run, 'notices_due': len(notices), 'notices_sent': sent, 'notices_failed': failed,
                   'invitations_purged': 0 if dry_run else len(purges), 'invitations_due': len(purges), **totals}
        log.info('retention run', extra={'retention': summary})
        self.stdout.write(' '.join(f'{k}={v}' for k, v in summary.items()))
