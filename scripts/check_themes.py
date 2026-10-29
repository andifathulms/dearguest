#!/usr/bin/env python3
"""Fail if the theme registry, its copies, or the theme packs are inconsistent.

Checks:
  * backend and frontend copies match shared/themes.json exactly
  * every entry has the required fields and allowed values; ids and demo slugs unique
  * every pack that isn't "coming" has theme.json, DESIGN.md, tokens.css and index.js,
    defines every required token, keeps overrides.css under the line cap, and
    references only slot names and asset files that exist

Usage: python3 scripts/check_themes.py   (exit status 1 on any problem)
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sync_themes import CANONICAL, FILES, OG_ROLES, ROOT, render_copy, render_crawlers, render_og  # noqa: E402

THEMES_DIR = ROOT / 'frontend' / 'src' / 'themes'
PACKS_DIR = THEMES_DIR / 'packs'
OVERRIDES_MAX_LINES = 150
PUBLIC_DIR = ROOT / 'frontend' / 'public'
PREVIEW_VIDEO_MAX_BYTES = 1536 * 1024

KINDS = {'pack'}
STATUSES = {'active', 'hidden', 'coming'}
TIERS = {'free', 'premium', 'cinematic'}
REQUIRED_FIELDS = ['id', 'name', 'collection', 'kind', 'status', 'tier', 'previewImage', 'demoSlug', 'catalog']
CATALOG_FIELDS = ['desc', 'category', 'colors', 'swatch', 'card']

# The token contract (docs/theme-packs.md). Every pack's tokens.css defines all of these.
REQUIRED_TOKENS = [
    # colour
    'bg', 'bg-alt', 'surface', 'surface-raised', 'ink', 'ink-muted', 'ink-faint',
    'accent', 'on-accent', 'line', 'line-strong', 'scrim', 'focus',
    # type
    'font-display', 'font-body', 'font-label',
    'fs-names', 'fs-title', 'fs-subtitle', 'fs-body', 'fs-small', 'fs-label',
    'lh-tight', 'lh-body', 'tracking-label', 'weight-display',
    # shape
    'radius-card', 'radius-button', 'radius-photo',
    # space
    'space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6',
    'section-pad-y', 'content-max', 'gutter',
    # depth
    'shadow-card', 'shadow-float',
    # motion
    'dur-fast', 'dur-base', 'dur-slow', 'ease', 'stagger',
]

SLOTS = {
    'cover-bg', 'cover-frame', 'corner-tl', 'corner-br', 'monogram-frame', 'heading-ornament',
    'divider', 'photo-mask', 'photo-ring', 'hero-overlay', 'parallax-back', 'parallax-mid',
    'parallax-front', 'particles', 'opening', 'gift-card', 'og-template', 'texture', 'hero-bg', 'hero-top', 'hero-bottom',
}
LAYOUTS = {'framed-card', 'full-bleed', 'arch', 'painted'}
HEROES = {'photo', 'framed'}
OPENINGS = {'none', 'css', 'lottie', 'layered-svg'}
# theme.json → motion (keep in step with frontend/src/themes/packs/_system/motion.js)
EXITS = {'fade', 'doors', 'curtain', 'gate', 'part', 'bloom'}
SIGNATURES = {'drift', 'sway', 'shimmer', 'breathe'}

errors = []


def err(msg):
    errors.append(msg)


def check_generated():
    """Crawler-list and og_assets copies match what `make sync` would write."""
    for path, text in render_crawlers().items():
        if not path.exists() or path.read_text(encoding='utf-8') != text:
            err(f'{path.relative_to(ROOT)} is out of date — run `make sync`')
    for path, data in render_og().items():
        if not path.exists() or path.read_bytes() != data:
            err(f'{path.relative_to(ROOT)} is out of date — run `make sync`')


def check_og(t, d, manifest):
    """Every live pack has a complete link-preview layout (og.py)."""
    og = manifest.get('og')
    if not og:
        err(f'{t["id"]}: theme.json has no "og" block (link-preview layout)')
        return
    for key in ('template', 'box', 'ink', 'accent', 'fonts'):
        if key not in og:
            err(f'{t["id"]}: og.{key} missing')
    if og.get('template') and not (d / og['template']).exists():
        err(f'{t["id"]}: og template {og["template"]} not found (scripts/build_pack_art.py --og-only)')
    for role in OG_ROLES:
        f = (og.get('fonts') or {}).get(role)
        if not f or not (d / f).exists():
            err(f'{t["id"]}: og font for "{role}" missing')
    box = og.get('box') or []
    if len(box) != 4 or not (0 <= box[0] < box[2] <= 1200 and 0 <= box[1] < box[3] <= 630):
        err(f'{t["id"]}: og.box must be [x0, y0, x1, y1] inside 1200x630')


def check_copies():
    for canonical, copies in FILES.items():
        expected = render_copy(canonical)
        for path in copies:
            rel = path.relative_to(ROOT)
            if not path.exists():
                err(f'{rel} is missing — run `make sync`')
            elif path.read_text(encoding='utf-8') != expected:
                err(f'{rel} differs from {canonical.relative_to(ROOT)} — run `make sync`')


# Keys every variant must define itself (no base fallback): they're the
# religion-specific lines.
VARIANT_KEYS = ['_label', '_blessing', '_scripture', '_defaultEvents', 'greeting.default', 'closing.default',
                'countdown.passed', 'share.greeting']
EVENT_TYPES = ['akad', 'pemberkatan', 'sakramen', 'resepsi', 'adat', 'ngunduh_mantu', 'lainnya']


def check_copy():
    copy = json.loads((ROOT / 'shared' / 'copy' / 'copy.json').read_text(encoding='utf-8'))
    scripture = json.loads((ROOT / 'shared' / 'copy' / 'scripture.json').read_text(encoding='utf-8'))
    ids = {e['id'] for e in scripture['entries']}
    for e in scripture['entries']:
        if e.get('verified') is not True and e.get('verified') is not False:
            err(f'scripture {e["id"]}: "verified" must be true or false')
        if not e.get('source'):
            err(f'scripture {e["id"]}: source missing')
    for locale, data in copy['locales'].items():
        base, variants = data['base'], data['variants']
        if list(variants) != copy['variantsOrder']:
            err(f'copy {locale}: variants {list(variants)} differ from variantsOrder')
        for t in EVENT_TYPES:
            if f'events.type.{t}' not in base:
                err(f'copy {locale}: base is missing events.type.{t}')
        for name, v in variants.items():
            for key in VARIANT_KEYS:
                if key not in v:
                    err(f'copy {locale}/{name}: missing variant key {key}')
            for key in v:
                if not key.startswith('_') and key not in base and key not in ('greeting.default', 'closing.default'):
                    err(f'copy {locale}/{name}: key {key} is not in base (typo?)')
            for ref in (v.get('_blessing'), v.get('_scripture')):
                if ref and ref not in ids:
                    err(f'copy {locale}/{name}: scripture id {ref!r} not in scripture.json')
            for t in v.get('_defaultEvents', []):
                if t not in EVENT_TYPES:
                    err(f'copy {locale}/{name}: unknown default event type {t!r}')


def check_entries(themes):
    seen_ids, seen_demos = set(), set()
    for t in themes:
        tid = t.get('id', '<no id>')
        for f in REQUIRED_FIELDS:
            if f not in t:
                err(f'{tid}: missing field "{f}"')
        for f in CATALOG_FIELDS:
            if f not in t.get('catalog', {}):
                err(f'{tid}: catalog missing "{f}"')
        if t.get('kind') not in KINDS:
            err(f'{tid}: kind must be one of {sorted(KINDS)}')
        if t.get('status') not in STATUSES:
            err(f'{tid}: status must be one of {sorted(STATUSES)}')
        if t.get('tier') not in TIERS:
            err(f'{tid}: tier must be one of {sorted(TIERS)}')
        if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', tid) or len(tid) > 30:
            err(f'{tid}: id must be a lowercase slug of at most 30 characters (Invitation.theme max_length)')
        if tid in seen_ids:
            err(f'{tid}: duplicate id')
        seen_ids.add(tid)
        demo = t.get('demoSlug')
        if demo:
            if demo in seen_demos:
                err(f'{tid}: demoSlug {demo} used twice')
            seen_demos.add(demo)
        # (This used to sit under `elif` after the demo check, so every pack
        # with a demo -- i.e. every live pack -- went unvalidated.)
        check_previews(t)
        if t.get('kind') == 'pack' and t.get('status') != 'coming':
            check_pack(t)


def check_previews(t):
    """The still and the optional loop (frontend/scripts/capture-docker.sh) exist and stay small."""
    tid = t.get('id', '<no id>')
    files = [('previewImage', t.get('previewImage'))]
    video = t.get('previewVideo')
    if video is not None:
        if not isinstance(video, dict) or set(video) != {'webm', 'mp4'}:
            err(f'{tid}: previewVideo must be {{"webm": ..., "mp4": ...}}')
            return
        files += [('previewVideo.webm', video['webm']), ('previewVideo.mp4', video['mp4'])]
    for field, url in files:
        if t.get('status') == 'coming' and field == 'previewImage':
            continue
        path = PUBLIC_DIR / str(url).lstrip('/')
        if not url or not path.is_file():
            err(f'{tid}: {field} {url} is not in frontend/public')
        elif field.startswith('previewVideo') and path.stat().st_size > PREVIEW_VIDEO_MAX_BYTES:
            err(f'{tid}: {field} is {path.stat().st_size // 1024} KB, over {PREVIEW_VIDEO_MAX_BYTES // 1024} KB')


def css_tokens(path):
    return set(re.findall(r'--dg-([a-z0-9-]+)\s*:', path.read_text(encoding='utf-8')))


def check_pack(t):
    d = PACKS_DIR / (t.get('pack') or {}).get('dir', t['id'])
    for name in ('theme.json', 'DESIGN.md', 'tokens.css', 'index.js'):
        if not (d / name).exists():
            err(f'{t["id"]}: pack file {d.relative_to(ROOT)}/{name} missing')
    if (d / 'tokens.css').exists():
        missing = [tok for tok in REQUIRED_TOKENS if tok not in css_tokens(d / 'tokens.css')]
        if missing:
            err(f'{t["id"]}: tokens.css is missing required tokens: {", ".join("--dg-" + m for m in missing)}')
    if (d / 'overrides.css').exists():
        n = len((d / 'overrides.css').read_text(encoding='utf-8').splitlines())
        if n > OVERRIDES_MAX_LINES:
            err(f'{t["id"]}: overrides.css has {n} lines (cap {OVERRIDES_MAX_LINES}); move it into tokens or the base layer')
    if (d / 'theme.json').exists():
        manifest = json.loads((d / 'theme.json').read_text(encoding='utf-8'))
        if manifest.get('layoutVariant') not in LAYOUTS:
            err(f'{t["id"]}: theme.json layoutVariant must be one of {sorted(LAYOUTS)}')
        if t.get('status') == 'active':
            check_og(t, d, manifest)
        if (manifest.get('opening') or {}).get('type') not in OPENINGS:
            err(f'{t["id"]}: theme.json opening.type must be one of {sorted(OPENINGS)}')
        motion = manifest.get('motion')
        if not isinstance(motion, dict):
            err(f'{t["id"]}: theme.json has no "motion" block (exit + signature, docs/theme-packs.md §9)')
        else:
            if motion.get('exit') not in EXITS:
                err(f'{t["id"]}: theme.json motion.exit must be one of {sorted(EXITS)}')
            sig = motion.get('signature')
            if not isinstance(sig, list) or not sig or not set(sig) <= SIGNATURES:
                err(f'{t["id"]}: theme.json motion.signature must be a non-empty list from {sorted(SIGNATURES)}')
        if manifest.get('hero', 'photo') not in HEROES:
            err(f'{t["id"]}: theme.json hero must be one of {sorted(HEROES)}')
        for slot, spec in (manifest.get('slots') or {}).items():
            if slot not in SLOTS:
                err(f'{t["id"]}: unknown slot "{slot}"')
            if not isinstance(spec, dict):
                continue
            files = [(key, spec.get(key)) for key in ('src', 'svg', 'fallback', 'avif')]
            files += [(f'desktop.{key}', (spec.get('desktop') or {}).get(key)) for key in ('src', 'avif')]
            files += [('frames', f) for f in spec.get('frames', [])]
            for key, path in files:
                if path and not (d / path).exists():
                    err(f'{t["id"]}: slot {slot} {key} file {path} not found')
            if isinstance(spec, dict) and spec.get('component') and not (d / spec['component']).exists():
                err(f'{t["id"]}: slot {slot} component {spec["component"]} not found')


def main():
    data = json.loads(CANONICAL.read_text(encoding='utf-8'))
    check_copies()
    check_generated()
    check_entries(data.get('themes', []))
    check_copy()
    if errors:
        print('Theme registry check FAILED:')
        for e in errors:
            print(f'  ✗ {e}')
        sys.exit(1)
    themes = data['themes']
    print(f'Theme registry OK: {len(themes)} themes '
          f'({sum(t["status"] == "active" for t in themes)} active, '
          f'{sum(t["status"] == "coming" for t in themes)} coming, '
          f'{sum(t["status"] == "hidden" for t in themes)} hidden).')


if __name__ == '__main__':
    main()
