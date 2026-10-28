"""Move invitations off the themes removed in October 2026 (the 36 legacy
CSS/WebGL themes and Minimal, none of which had painted art) onto the closest
remaining pack by colour and mood. The mapping is frozen here on purpose: it
must not change if the registry does. Prints a report (shown by `migrate`)."""
from collections import Counter

from django.db import migrations

REMAP = {
    'minimal': 'sage',
    'floral-light': 'sage',
    'modern-minimalist': 'sage',
    'rustic-kraft': 'sage',
    'dusty-blue': 'sage',
    'sage-botanical': 'sage',
    'mauve-rose': 'sage',
    'lavender-dream': 'sage',
    'coral-peach': 'sage',
    'rose-gold': 'sage',
    'mono-editorial': 'sage',
    'petals-3d': 'sage',
    'snow-3d': 'sage',
    'javanese-dark': 'javanese',
    'ivory-classic': 'javanese',
    'boho-terracotta': 'javanese',
    'sunflower-mustard': 'javanese',
    'beige-korean': 'javanese',
    'marble-white': 'javanese',
    'clouds-3d': 'javanese',
    'burgundy-gold': 'floral',
    'plum-gold': 'floral',
    'royal-purple': 'floral',
    'luxury-emerald': 'bugis',
    'buginese-blue': 'bugis',
    'tropical-green': 'bugis',
    'islamic-arabesque': 'bugis',
    'teal-ocean': 'bugis',
    'aurora-3d': 'bugis',
    'fireflies-3d': 'bugis',
    'midnight-celestial': 'minang',
    'charcoal-marble': 'minang',
    'navy-gold': 'minang',
    'deco-noir': 'minang',
    'celestial-cinematic': 'minang',
    'golden-3d': 'minang',
    'lanterns-3d': 'minang',
}


def forwards(apps, schema_editor):
    Invitation = apps.get_model('invitations', 'Invitation')
    moved = Counter()
    for old, new in REMAP.items():
        n = Invitation.objects.filter(theme=old).update(theme=new)
        if n:
            moved[(old, new)] += n
    total = sum(moved.values())
    detail = ', '.join(f'{old}->{new} {n}' for (old, new), n in sorted(moved.items()))
    print(f'\n    0040: {total} invitations moved to a remaining theme' + (f' ({detail})' if detail else ''))


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0039_processed_images'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
