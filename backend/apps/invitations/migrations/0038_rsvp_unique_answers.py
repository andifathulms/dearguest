from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0037_rsvp_dedupe_data'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='rsvp',
            constraint=models.UniqueConstraint(condition=models.Q(('guest__isnull', False)), fields=('invitation', 'guest'), name='one_rsvp_per_guest'),
        ),
        migrations.AddConstraint(
            model_name='rsvp',
            constraint=models.UniqueConstraint(condition=models.Q(('guest__isnull', True), models.Q(('whatsapp_norm', ''), _negated=True)), fields=('invitation', 'whatsapp_norm'), name='one_rsvp_per_whatsapp'),
        ),
    ]
