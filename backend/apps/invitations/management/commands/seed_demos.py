"""Seed one public demo invitation per theme so the landing page can link to
live examples. Idempotent — safe to run repeatedly."""
from datetime import date, datetime
from django.core.management.base import BaseCommand
from apps.invitations.models import Invitation, Couple, Event, Story, BankAccount

THEMES = [
    ('javanese-dark', 'demo-javanese'),
    ('floral-light', 'demo-floral'),
    ('modern-minimalist', 'demo-minimalis'),
    ('luxury-emerald', 'demo-emerald'),
    ('rustic-kraft', 'demo-rustic'),
    ('boho-terracotta', 'demo-boho'),
]


class Command(BaseCommand):
    help = 'Create/update a public demo invitation for each theme.'

    def handle(self, *args, **options):
        for theme, slug in THEMES:
            inv, _ = Invitation.objects.update_or_create(
                slug=slug,
                defaults=dict(
                    theme=theme,
                    is_active=True,
                    wedding_date=date(2026, 12, 12),
                    opening_text='Dengan memohon rahmat dan ridho Tuhan Yang Maha Esa, kami bermaksud menyelenggarakan pernikahan putra-putri kami.',
                    closing_text='Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.',
                    dress_code='Earth tone / Batik',
                    watermark=True,
                    tier='free',
                ),
            )
            Couple.objects.update_or_create(invitation=inv, defaults=dict(
                bride_name='Andini', bride_parents='Bapak Suryadi & Ibu Lestari',
                bride_bio='Putri pertama yang penuh kasih.',
                groom_name='Bagus', groom_parents='Bapak Hartono & Ibu Wulandari',
                groom_bio='Putra kedua yang penuh tanggung jawab.',
            ))
            inv.events.all().delete()
            Event.objects.create(invitation=inv, event_type='akad', datetime=datetime(2026, 12, 12, 8, 0),
                                 venue_name='Masjid Agung', address='Jl. Merdeka No. 1, Yogyakarta',
                                 gmaps_url='https://maps.google.com',
                                 gmaps_embed_url='https://www.google.com/maps?q=yogyakarta&output=embed', order=0)
            Event.objects.create(invitation=inv, event_type='resepsi', datetime=datetime(2026, 12, 12, 11, 0),
                                 venue_name='Gedung Graha', address='Jl. Sudirman No. 45, Yogyakarta',
                                 gmaps_url='https://maps.google.com',
                                 gmaps_embed_url='https://www.google.com/maps?q=yogyakarta&output=embed', order=1)
            inv.stories.all().delete()
            Story.objects.create(invitation=inv, title='Pertama Bertemu', description='Dipertemukan di sebuah acara kampus.', date=date(2021, 3, 1), order=0)
            Story.objects.create(invitation=inv, title='Lamaran', description='Bagus melamar Andini di hadapan keluarga.', date=date(2025, 11, 1), order=1)
            inv.bank_accounts.all().delete()
            BankAccount.objects.create(invitation=inv, account_type='bank', bank_name='BCA', account_number='1234567890', account_name='Andini', order=0)
            BankAccount.objects.create(invitation=inv, account_type='ewallet', bank_name='GoPay', account_number='081234567890', account_name='Bagus', order=1)
            self.stdout.write(f'  demo ready: /{slug} ({theme})')
        self.stdout.write(self.style.SUCCESS('All 6 demo invitations seeded.'))
