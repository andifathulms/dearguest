#!/usr/bin/env python3
"""Copy shared/themes.json into the backend and frontend.

The backend and frontend are built from separate Docker contexts (./backend,
./frontend), so neither can read a file at the repo root. Each gets a generated
copy instead; scripts/check_themes.py fails if a copy ever drifts.

Usage: python3 scripts/sync_themes.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CANONICAL = ROOT / 'shared' / 'themes.json'
COPIES = [
    ROOT / 'backend' / 'apps' / 'invitations' / 'theme_registry.json',
    ROOT / 'frontend' / 'src' / 'themes' / 'registry.json',
]
MARKER = 'GENERATED from shared/themes.json by scripts/sync_themes.py — do not edit by hand.'


def render_copy():
    """The exact bytes every copy must contain."""
    data = json.loads(CANONICAL.read_text(encoding='utf-8'))
    return json.dumps({'_generated': MARKER, **data}, indent=2, ensure_ascii=False) + '\n'


def main():
    text = render_copy()
    for path in COPIES:
        path.write_text(text, encoding='utf-8')
        print(f'wrote {path.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
