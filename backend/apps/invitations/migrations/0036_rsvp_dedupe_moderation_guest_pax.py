import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0035_couple_family_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='rsvp',
            name='whatsapp_norm',
            field=models.CharField(blank=True, db_index=True, editable=False, max_length=20),
        ),
        migrations.AddField(
            model_name='rsvp',
            name='wish_status',
            field=models.CharField(choices=[('visible', 'Tampil'), ('pending', 'Menunggu persetujuan'), ('hidden', 'Disembunyikan')], default='visible', max_length=10),
        ),
        migrations.AddField(
            model_name='rsvp',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='guest',
            name='max_pax',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]
