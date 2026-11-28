from django.db import migrations


# The brand is now Vowvella. The plan cards seeded in 0045 name the old brand in
# their features (the free plan's watermark line); rewrite it where it still does.
def forwards(apps, schema_editor):
    Plan = apps.get_model('invitations', 'Plan')
    for plan in Plan.objects.filter(features__contains='DearGuest'):
        plan.features = plan.features.replace('DearGuest', 'Vowvella')
        plan.save(update_fields=['features'])


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0051_guest_table'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
