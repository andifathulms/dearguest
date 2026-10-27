# Postgres can't alter a table with pending trigger events in the same
# transaction, so the data step is its own migration.
from urllib.parse import parse_qs, quote_plus, urlparse

from django.db import migrations, models

PLACEHOLDER_LINKS = {'https://maps.google.com', 'http://maps.google.com', 'https://maps.google.com/'}


def forwards(apps, schema_editor):
    """Map existing events onto the new model.

    * timezone: every existing event was entered as Jakarta time (the server's
      TIME_ZONE), so it gets Asia/Jakarta (the field default) -- unchanged times.
    * maps_link: the old "open in Maps" link, unless it's the seed placeholder;
      if empty, the place query from the old embed URL.
    * is_primary: the akad if there is one, otherwise the earliest event.
    Prints a short report (shown by `migrate`).
    """
    Event = apps.get_model('invitations', 'Event')
    Invitation = apps.get_model('invitations', 'Invitation')
    total = cleared = derived = kept = 0
    for e in Event.objects.all():
        total += 1
        link = (e.gmaps_url or '').strip()
        if link in PLACEHOLDER_LINKS:
            link, cleared = '', cleared + 1
        if not link and e.gmaps_embed_url:
            q = parse_qs(urlparse(e.gmaps_embed_url).query).get('q', [''])[0]
            if q:
                link, derived = f'https://www.google.com/maps/search/?api=1&query={quote_plus(q)}', derived + 1
        elif link:
            kept += 1
        e.maps_link = link
        e.save(update_fields=['maps_link'])
    primaries = 0
    for inv in Invitation.objects.all():
        events = Event.objects.filter(invitation=inv).order_by('order', 'start', 'id')
        first = events.filter(event_type='akad').first() or events.first()
        if first:
            first.is_primary = True
            first.save(update_fields=['is_primary'])
            primaries += 1
    print(f'\n    0032: {total} events migrated (timezone Asia/Jakarta); {primaries} primary events set; '
          f'maps links kept {kept}, placeholder cleared {cleared}, derived from embed {derived}')



class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0031_events_types_timezones_primary'),
    ]

    operations = [
        # Existing akad/resepsi rows map to the new model unchanged; see forwards().
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
