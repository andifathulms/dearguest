"""Guest-facing copy and scripture, read from copy_data/ (generated from
shared/copy/ by scripts/sync_themes.py). The backend needs it to validate the
couple's variant and to label events in .ics files and CSV exports."""
import json
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ValidationError

DATA = Path(__file__).resolve().parent / 'copy_data'
LOCALE = 'id'
DEFAULT_VARIANT = 'umum'


@lru_cache(maxsize=1)
def _copy():
    return json.loads((DATA / 'copy.json').read_text(encoding='utf-8'))


@lru_cache(maxsize=1)
def _scripture():
    data = json.loads((DATA / 'scripture.json').read_text(encoding='utf-8'))
    return {e['id']: e for e in data['entries']}


def variants():
    return list(_copy()['variantsOrder'])


def variant_choices():
    labels = _copy()['locales'][LOCALE]['variants']
    return [(v, labels[v]['_label']) for v in variants()]


def variant_meta(variant):
    return _copy()['locales'][LOCALE]['variants'][variant]


def t(key, variant=DEFAULT_VARIANT, **values):
    loc = _copy()['locales'][LOCALE]
    text = loc['variants'].get(variant, {}).get(key, loc['base'].get(key, key))
    for name, value in values.items():
        text = text.replace('{' + name + '}', str(value))
    return text


def event_label(event_type, variant=DEFAULT_VARIANT, title=''):
    """The couple's own title wins; otherwise the variant's label for the type."""
    return title or t(f'events.type.{event_type}', variant)


def scripture(entry_id):
    return _scripture().get(entry_id)


def validate_variant(value):
    if value not in variants():
        raise ValidationError(f'Gaya bahasa "{value}" tidak dikenal.')
