"""The Staf group writes and publishes blog articles (0058); deleting one
stays with the owner."""
from django.db import migrations


def forwards(apps, schema_editor):
    from django.contrib.auth.management import create_permissions

    for app_config in apps.get_app_configs():
        app_config.models_module = True
        create_permissions(app_config, apps=apps, verbosity=0)
        app_config.models_module = None
    group = apps.get_model('auth', 'Group').objects.filter(name='Staf').first()
    if group:
        group.permissions.add(*apps.get_model('auth', 'Permission').objects.filter(
            content_type__app_label='invitations',
            codename__in=['view_article', 'add_article', 'change_article', 'view_articleimage', 'add_articleimage']))


class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('invitations', '0058_blog'),
    ]

    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
