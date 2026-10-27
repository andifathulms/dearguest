# Event model for Phase 2: more types, custom title, end, timezone, coordinates,
# dress code, primary flag. Schema only; data in 0032, cleanup in 0033.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invitations', '0030_copy_variant_scripture_gift_moderation'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='event',
            options={'ordering': ['order', 'start']},
        ),
        migrations.RenameField(
            model_name='event',
            old_name='datetime',
            new_name='start',
        ),
        migrations.AddField(
            model_name='event',
            name='dress_code',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='event',
            name='end',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='is_primary',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='event',
            name='lat',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='lng',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='maps_link',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='event',
            name='timezone',
            field=models.CharField(choices=[('Asia/Jakarta', 'WIB'), ('Asia/Makassar', 'WITA'), ('Asia/Jayapura', 'WIT')], default='Asia/Jakarta', max_length=40),
        ),
        migrations.AddField(
            model_name='event',
            name='title',
            field=models.CharField(blank=True, help_text='Nama sendiri, mis. "Mappacci" atau "Siraman".', max_length=120),
        ),
        migrations.AlterField(
            model_name='event',
            name='event_type',
            field=models.CharField(choices=[('akad', 'Akad Nikah'), ('pemberkatan', 'Pemberkatan Nikah'), ('sakramen', 'Sakramen Perkawinan'), ('resepsi', 'Resepsi'), ('adat', 'Upacara Adat'), ('ngunduh_mantu', 'Ngunduh Mantu'), ('lainnya', 'Lainnya')], max_length=20),
        ),
    ]
