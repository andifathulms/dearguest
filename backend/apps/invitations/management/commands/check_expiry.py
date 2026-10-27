"""Report invitations whose expires_at doesn't match wedding_date + the grace period.

Two groups:
  * expires before the wedding -- broken; fixed with --apply
  * any other mismatch        -- reported only; may be an admin's manual extension
"""
from datetime import timedelta

from django.core.management.base import BaseCommand

from apps.invitations.models import Invitation, EXPIRY_DAYS_AFTER_WEDDING


class Command(BaseCommand):
    help = 'Report expires_at mismatches; --apply fixes only those that expire before the wedding.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Fix rows that expire before the wedding.')

    def handle(self, *args, apply=False, **options):
        grace = timedelta(days=EXPIRY_DAYS_AFTER_WEDDING)
        broken, other = [], []
        for inv in Invitation.objects.order_by('slug'):
            expected = inv.wedding_date + grace
            if inv.expires_at is None or inv.expires_at < inv.wedding_date:
                broken.append((inv, expected))
            elif inv.expires_at != expected:
                other.append((inv, expected))

        self.stdout.write(f'Expires before the wedding: {len(broken)}')
        for inv, expected in broken:
            self.stdout.write(f'  ✗ {inv.slug} wedding={inv.wedding_date} expires={inv.expires_at} -> {expected}')
        self.stdout.write(f'Other mismatches (left alone): {len(other)}')
        for inv, expected in other:
            self.stdout.write(f'  ~ {inv.slug} wedding={inv.wedding_date} expires={inv.expires_at} (default {expected})')

        if not apply:
            self.stdout.write('Report only — run with --apply to fix the first group.')
            return
        for inv, expected in broken:
            # update() skips save(), so nothing else on the row is touched.
            Invitation.objects.filter(pk=inv.pk).update(expires_at=expected)
        self.stdout.write(self.style.SUCCESS(f'Fixed {len(broken)} invitation(s).'))
