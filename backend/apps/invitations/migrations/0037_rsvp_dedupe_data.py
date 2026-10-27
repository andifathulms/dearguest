# Postgres can't alter a table with pending trigger events in the same
# transaction, so the data step is its own migration (as with 0032).
import re

from django.db import migrations


def normalise_whatsapp(value):
    # Frozen copy of models.normalise_whatsapp.
    digits = re.sub(r'\D', '', value or '')
    if digits.startswith('0'):
        digits = '62' + digits[1:]
    elif digits.startswith('8'):
        digits = '62' + digits
    return digits if 9 <= len(digits) <= 15 else ''


def forwards(apps, schema_editor):
    """Normalise WhatsApp numbers, set updated_at = submitted_at, then merge
    duplicate answers -- same guest, or (without a guest) same number -- keeping
    the latest. Prints a short report (shown by `migrate`)."""
    RSVP = apps.get_model('invitations', 'RSVP')
    normalised = 0
    for r in RSVP.objects.all():
        r.whatsapp_norm = normalise_whatsapp(r.whatsapp)
        normalised += bool(r.whatsapp_norm)
        RSVP.objects.filter(pk=r.pk).update(whatsapp_norm=r.whatsapp_norm, updated_at=r.submitted_at)

    merged = 0
    seen = set()
    for r in RSVP.objects.order_by('-submitted_at', '-id'):
        if r.guest_id:
            key = ('guest', r.invitation_id, r.guest_id)
        elif r.whatsapp_norm:
            key = ('wa', r.invitation_id, r.whatsapp_norm)
        else:
            continue
        if key in seen:
            r.delete()
            merged += 1
        else:
            seen.add(key)
    print(f'\n    0037: {RSVP.objects.count()} RSVPs; WhatsApp normalised {normalised}; '
          f'older duplicates merged away {merged}')


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0036_rsvp_dedupe_moderation_guest_pax'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
