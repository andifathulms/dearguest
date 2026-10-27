# Drop the old map fields (copied into maps_link by 0032) and enforce one
# primary event per invitation (set by 0032).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0032_events_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='event',
            name='gmaps_embed_url',
        ),
        migrations.RemoveField(
            model_name='event',
            name='gmaps_url',
        ),
        migrations.AddConstraint(
            model_name='event',
            constraint=models.UniqueConstraint(condition=models.Q(('is_primary', True)), fields=('invitation',), name='one_primary_event_per_invitation'),
        ),
    ]
