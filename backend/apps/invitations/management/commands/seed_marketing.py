"""Landing-page content for local development.

    python manage.py seed_marketing --sample-testimonials [--publish]

Plans are seeded by migration 0045 and edited in the admin; this command only
adds placeholder testimonials, marked `is_sample`, so the testimonials section
can be designed and reviewed before real quotes exist. They are created
unpublished unless --publish is given. Replace them with real couples' words
(with their consent) before launch: placeholder quotes on a live sales page
mislead buyers. Run it again and it changes nothing (matched by names)."""
from django.core.management.base import BaseCommand

from apps.invitations import themes
from apps.invitations.models import Testimonial

SAMPLES = [
    ('Rani & Dimas', 'Bandung', 'sunda',
     'Tamu kami banyak yang bilang undangannya cantik sekali. Yang paling disukai: nama mereka langsung muncul di sampul.'),
    ('Nadia & Fikri', 'Makassar', 'bugis',
     'Kami isi sendiri semalam, besok paginya sudah terkirim ke semua keluarga lewat WhatsApp. RSVP-nya rapi.'),
    ('Clara & Yosua', 'Medan', 'batak',
     'Pilihan teks Kristen-nya pas, dan tema Gorga Ulos bikin keluarga besar bangga.'),
]


class Command(BaseCommand):
    help = 'Add placeholder testimonials (is_sample) for local development.'

    def add_arguments(self, parser):
        parser.add_argument('--sample-testimonials', action='store_true', help='Create the placeholder quotes.')
        parser.add_argument('--publish', action='store_true', help='Publish them (local review only).')

    def handle(self, *args, **opts):
        if not opts['sample_testimonials']:
            self.stdout.write('Nothing to do: pass --sample-testimonials.')
            return
        made = 0
        for order, (names, city, theme, quote) in enumerate(SAMPLES):
            _, created = Testimonial.objects.get_or_create(names=names, defaults=dict(
                city=city, theme=theme if themes.get(theme) else '', quote=quote,
                is_sample=True, is_published=opts['publish'], order=order,
            ))
            made += created
        if opts['publish']:
            Testimonial.objects.filter(is_sample=True).update(is_published=True)
        state = 'published' if opts['publish'] else 'unpublished'
        self.stdout.write(self.style.WARNING(
            f'{made} placeholder testimonial(s) created ({state}). Replace them with real quotes before launch.'))
