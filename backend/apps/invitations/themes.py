"""Theme registry, read from theme_registry.json (generated from shared/themes.json
by scripts/sync_themes.py; scripts/check_themes.py keeps it in sync)."""
import json
from functools import lru_cache
from pathlib import Path

from django.core.exceptions import ValidationError

REGISTRY_PATH = Path(__file__).resolve().parent / 'theme_registry.json'
DEFAULT_THEME = 'sage'


@lru_cache(maxsize=1)
def _load():
    return json.loads(REGISTRY_PATH.read_text(encoding='utf-8'))


def entries():
    """{id: entry} for every registered theme, in registry order."""
    return {t['id']: t for t in _load()['themes']}


def get(theme_id):
    return entries().get(theme_id)


def is_demo_slug(slug):
    """A theme's demo invitation (seed_demos), not a couple's."""
    return any(t.get('demoSlug') == slug for t in _load()['themes'])


def is_selectable(theme_id):
    """Couples may pick only active themes."""
    entry = get(theme_id)
    return bool(entry) and entry['status'] == 'active'


def choices(include_hidden=True):
    """(id, label) pairs for forms; non-active themes are labelled with their status."""
    return [
        (t['id'], t['name'] if t['status'] == 'active' else f"{t['name']} ({t['status']})")
        for t in entries().values()
        if include_hidden or t['status'] == 'active'
    ]


def validate_registered_theme(value):
    """Model-level check: the id must exist in the registry (any status)."""
    if not get(value):
        raise ValidationError(f'Tema "{value}" tidak dikenal.')


def validate_theme_choice(value, current=None):
    """Create/change check: only active themes, unless the value is unchanged."""
    if value == current:
        return value
    if not get(value):
        raise ValidationError(f'Tema "{value}" tidak dikenal.')
    if not is_selectable(value):
        raise ValidationError('Tema ini tidak tersedia untuk dipilih.')
    return value
