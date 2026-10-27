# Postgres can't alter a table with pending trigger events in the same
# transaction, so the data step is its own migration (as with 0032).
import re

from django.db import migrations

FATHER_PREFIX = re.compile(r'^(bapak|bpk\.?|bp\.?|pak)\s+', re.I)
MOTHER_PREFIX = re.compile(r'^(ibu|ibu\.|bu\.?)\s+', re.I)
LATE = re.compile(r'\(?\s*\b(alm(?:arhum(?:ah)?|h)?)\b\.?\s*\)?', re.I)


def split_parent(text, prefix):
    """'Bapak Suryadi (Alm.)' -> ('Suryadi', True). The honorific is re-added on display."""
    deceased = bool(LATE.search(text))
    name = LATE.sub(' ', text)
    name = prefix.sub('', ' '.join(name.split())).strip(' ,.')
    return name, deceased


def split_parents(value):
    """'Bapak X & Ibu Y' -> (father, father_late, mother, mother_late), or None
    when the text isn't two names joined by one '&'."""
    parts = [p.strip() for p in (value or '').split('&')]
    if len(parts) != 2 or not all(parts):
        return None
    father, father_late = split_parent(parts[0], FATHER_PREFIX)
    mother, mother_late = split_parent(parts[1], MOTHER_PREFIX)
    if not father or not mother:
        return None
    return father, father_late, mother, mother_late


def forwards(apps, schema_editor):
    """Split each `*_parents` into father/mother (+ Alm./Almh. flags). Text that
    doesn't parse is left in `*_parents`, which still renders as before.
    Prints a short report (shown by `migrate`)."""
    Couple = apps.get_model('invitations', 'Couple')
    split = kept = empty = 0
    for c in Couple.objects.all():
        fields = []
        for person in ('bride', 'groom'):
            raw = (getattr(c, f'{person}_parents') or '').strip()
            parsed = split_parents(raw)
            if parsed:
                split += 1
                father, father_late, mother, mother_late = parsed
                for key, value in (('father', father), ('father_deceased', father_late),
                                   ('mother', mother), ('mother_deceased', mother_late)):
                    setattr(c, f'{person}_{key}', value)
                    fields.append(f'{person}_{key}')
            elif raw:
                kept += 1
            else:
                empty += 1
        if fields:
            c.save(update_fields=fields)
    print(f'\n    0035: parents split into father/mother {split}, kept as free text {kept}, empty {empty}')


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0034_couple_family_instagram'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
