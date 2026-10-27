#!/usr/bin/env python3
"""Copy the shared data files into the backend and frontend.

The backend and frontend are built from separate Docker contexts (./backend,
./frontend), so neither can read a file at the repo root. Each gets a generated
copy instead; scripts/check_themes.py fails if a copy ever drifts.

  shared/themes.json         theme registry
  shared/copy/copy.json      guest-facing copy per locale and religion variant
  shared/copy/scripture.json scripture entries (built by scripts/build_scripture.py)

Usage: python3 scripts/sync_themes.py   (`make sync`, alias `make themes`)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / 'backend' / 'apps' / 'invitations'
FRONTEND = ROOT / 'frontend' / 'src'

# canonical file -> generated copies
FILES = {
    ROOT / 'shared' / 'themes.json': [
        BACKEND / 'theme_registry.json',
        FRONTEND / 'themes' / 'registry.json',
    ],
    ROOT / 'shared' / 'copy' / 'copy.json': [
        BACKEND / 'copy_data' / 'copy.json',
        FRONTEND / 'copy' / 'copy.json',
    ],
    ROOT / 'shared' / 'copy' / 'scripture.json': [
        BACKEND / 'copy_data' / 'scripture.json',
        FRONTEND / 'copy' / 'scripture.json',
    ],
}

# Kept for scripts/check_themes.py and older call sites.
CANONICAL = ROOT / 'shared' / 'themes.json'
COPIES = FILES[CANONICAL]

MARKER = 'GENERATED from {src} by scripts/sync_themes.py — do not edit by hand.'


def render_copy(canonical=CANONICAL):
    """The exact bytes every copy of `canonical` must contain."""
    data = json.loads(canonical.read_text(encoding='utf-8'))
    marker = MARKER.format(src=canonical.relative_to(ROOT))
    return json.dumps({'_generated': marker, **data}, indent=2, ensure_ascii=False) + '\n'


def main():
    for canonical, copies in FILES.items():
        text = render_copy(canonical)
        for path in copies:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding='utf-8')
            print(f'wrote {path.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
