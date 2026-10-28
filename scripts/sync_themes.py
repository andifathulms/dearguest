#!/usr/bin/env python3
"""Copy the shared data files into the backend and frontend.

The backend and frontend are built from separate Docker contexts (./backend,
./frontend), so neither can read a file at the repo root. Each gets a generated
copy instead; scripts/check_themes.py fails if a copy ever drifts.

  shared/themes.json         theme registry
  shared/copy/copy.json      guest-facing copy per locale and religion variant
  shared/copy/scripture.json scripture entries (built by scripts/build_scripture.py)
  shared/crawlers.txt        link-preview crawler user-agents (nginx map, Vite proxy, backend)
  packs/<id>/theme.json og   each pack's link-preview layout, template and fonts -> backend og_assets/

Usage: python3 scripts/sync_themes.py   (`make sync`, alias `make themes`)
"""
import json
import shutil
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


PACKS = FRONTEND / 'themes' / 'packs'
OG_ASSETS = BACKEND / 'og_assets'
OG_ROLES = ('names', 'label', 'text')
# Packs without an og block fall back to this generic DearGuest look (og.py),
# which borrows these fonts.
OG_GENERIC_FONTS = 'sage'

CRAWLERS = ROOT / 'shared' / 'crawlers.txt'
CRAWLER_COPIES = {
    'json': [BACKEND / 'crawlers.json', ROOT / 'frontend' / 'crawlers.json'],
    'nginx': ROOT / 'nginx' / 'snippets' / 'og-crawlers.conf',
}


def crawler_patterns():
    return [line.strip() for line in CRAWLERS.read_text(encoding='utf-8').splitlines()
            if line.strip() and not line.startswith('#')]


def render_crawlers():
    """{path: exact text} for every generated crawler-list copy."""
    pats = crawler_patterns()
    marker = MARKER.format(src=CRAWLERS.relative_to(ROOT))
    out = {p: json.dumps({'_generated': marker, 'patterns': pats}, indent=2) + '\n' for p in CRAWLER_COPIES['json']}
    lines = [f'# {marker}', '# Included in the http context (default.conf.template).',
             'map $http_user_agent $og_crawler {', '    default 0;']
    lines += [f'    "~*{p.replace(chr(34), "")}" 1;' for p in pats] + ['}']
    out[CRAWLER_COPIES['nginx']] = '\n'.join(lines) + '\n'
    return out


def og_sources():
    """{pack id: (pack dir, og block)} for every pack with a link-preview layout."""
    out = {}
    for d in sorted(PACKS.iterdir()):
        manifest = d / 'theme.json'
        if d.name.startswith('_') or not manifest.exists():
            continue
        og = json.loads(manifest.read_text(encoding='utf-8')).get('og')
        if og:
            out[d.name] = (d, og)
    return out


def render_og():
    """{backend path: bytes} for every og_assets file: per pack an og.json
    (fonts renamed by role), template.jpg and <role>.woff2; plus _generic fonts."""
    files = {}
    for pack, (d, og) in og_sources().items():
        dest = OG_ASSETS / pack
        meta = {k: v for k, v in og.items() if k not in ('template', 'fonts')}
        meta['_generated'] = MARKER.format(src=(d / 'theme.json').relative_to(ROOT))
        files[dest / 'og.json'] = (json.dumps(meta, indent=2) + '\n').encode()
        files[dest / 'template.jpg'] = (d / og['template']).read_bytes()
        for role in OG_ROLES:
            files[dest / f'{role}.woff2'] = (d / og['fonts'][role]).read_bytes()
    generic = og_sources().get(OG_GENERIC_FONTS)
    if generic:
        d, og = generic
        for role in OG_ROLES:
            files[OG_ASSETS / '_generic' / f'{role}.woff2'] = (d / og['fonts'][role]).read_bytes()
    return files


def main():
    for canonical, copies in FILES.items():
        text = render_copy(canonical)
        for path in copies:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding='utf-8')
            print(f'wrote {path.relative_to(ROOT)}')
    for path, text in render_crawlers().items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')
        print(f'wrote {path.relative_to(ROOT)}')
    files = render_og()
    if OG_ASSETS.exists():   # drop assets of packs that no longer exist
        shutil.rmtree(OG_ASSETS)
    for path, data in files.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    print(f'wrote {OG_ASSETS.relative_to(ROOT)}/ ({len(files)} files, {len(og_sources())} packs)')


if __name__ == '__main__':
    main()
