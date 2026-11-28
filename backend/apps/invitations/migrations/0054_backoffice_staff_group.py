"""The Staf group for backoffice helpers (backoffice.py), and activated_at for
invitations that went live before the field existed.

Staf can see invitations, guests and answers, moderate wishes, edit couple
profiles and confirm activations (which records a payment), but not see
payments or delete anything. Give a helper is_staff and this group; the owner
stays a superuser."""
from django.db import migrations
from django.db.models import F
from django.db.models.functions import Coalesce

STAFF_GROUP = 'Staf'
STAFF_PERMISSIONS = [
    'view_invitation', 'change_invitation',
    'view_activationrequest', 'change_activationrequest',
    'view_rsvp', 'change_rsvp',
    'view_guest',
    'view_coupleprofile', 'change_coupleprofile',
    'view_coupon', 'view_funnelevent',
    'add_payment',
]


def forwards(apps, schema_editor):
    from django.contrib.auth.management import create_permissions

    # Permissions are normally created after migrate; this group needs them now.
    for app_config in apps.get_app_configs():
        app_config.models_module = True
        create_permissions(app_config, apps=apps, verbosity=0)
        app_config.models_module = None
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')
    group, _ = Group.objects.get_or_create(name=STAFF_GROUP)
    group.permissions.add(*Permission.objects.filter(content_type__app_label='invitations',
                                                     codename__in=STAFF_PERMISSIONS))

    Invitation = apps.get_model('invitations', 'Invitation')
    Invitation.objects.filter(is_active=True, activated_at__isnull=True).update(
        activated_at=Coalesce(F('activation_requested_at'), F('created_at')))


def backwards(apps, schema_editor):
    apps.get_model('auth', 'Group').objects.filter(name=STAFF_GROUP).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('invitations', '0053_backoffice'),
    ]

    operations = [migrations.RunPython(forwards, backwards)]
