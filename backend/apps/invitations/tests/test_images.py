"""Image pipeline: every upload is stored upright and without EXIF (GPS),
large photos are scaled down, responsive fields get WebP renditions with
srcset metadata, QRIS stays sharp, and the backfill command fixes old files."""
import io
from io import StringIO
from unittest import mock

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from PIL import Image

from apps.invitations import images
from apps.invitations.models import BankAccount, Photo, ProcessedImage
from apps.invitations.uploads import validate_image_upload

from .base import APITestBase

ORIENTATION, GPS_IFD = 0x0112, 0x8825


def jpeg_with_exif(size=(1200, 800), rotate_tag=6):
    """A landscape JPEG whose EXIF says 'rotate 90° CW' and carries a GPS block,
    as a phone held upright writes it."""
    img = Image.new('RGB', size, (180, 90, 60))
    img.paste((20, 20, 200), (0, 0, size[0] // 4, size[1] // 4))   # marks the top-left corner
    exif = Image.Exif()
    exif[ORIENTATION] = rotate_tag
    exif[GPS_IFD] = {1: 'S', 2: (7.0, 48.0, 13.0)}
    buf = io.BytesIO()
    img.save(buf, 'JPEG', exif=exif.tobytes())
    return buf.getvalue()


def upload(data, name='foto.jpg', mime='image/jpeg'):
    return SimpleUploadedFile(name, data, content_type=mime)


def stored(f):
    with default_storage.open(f.name) as fh:
        img = Image.open(fh)
        img.load()
        return img


class UploadProcessingTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, active=True)
        self.login(self.owner)

    def post_photo(self, data, **kw):
        return self.client.post(f'/api/my/invitations/{self.inv.slug}/photos/', {'image': upload(data, **kw)}, format='multipart')

    def test_editor_upload_is_upright_and_exif_free(self):
        res = self.post_photo(jpeg_with_exif())
        self.assertEqual(res.status_code, 201, res.data)
        img = stored(Photo.objects.get().image)
        self.assertEqual(img.size, (800, 1200))            # rotated upright
        self.assertFalse(img.info.get('exif'))
        self.assertEqual(len(img.getexif()), 0)             # no orientation, no GPS

    def test_renditions_are_built_and_never_upscaled(self):
        self.post_photo(jpeg_with_exif(size=(1200, 800), rotate_tag=1))
        photo = Photo.objects.get()
        p = ProcessedImage.objects.get(name=photo.image.name)
        self.assertEqual((p.width, p.height), (1200, 800))
        self.assertEqual(sorted(p.variants), ['480', '960'])   # no 1600 for a 1200px original
        for width, name in p.variants.items():
            with default_storage.open(name) as fh:
                small = Image.open(fh)
                self.assertEqual((small.format, small.width), ('WEBP', int(width)))

    def test_huge_originals_are_scaled_down(self):
        self.post_photo(jpeg_with_exif(size=(4000, 3000), rotate_tag=1))
        self.assertEqual(stored(Photo.objects.get().image).size, (images.MAX_EDGE, 1920))

    def test_png_keeps_its_format_and_transparency(self):
        img = Image.new('RGBA', (600, 400), (0, 0, 0, 0))
        buf = io.BytesIO()
        img.save(buf, 'PNG')
        self.post_photo(buf.getvalue(), name='logo.png', mime='image/png')
        out = stored(Photo.objects.get().image)
        self.assertEqual((out.format, out.mode), ('PNG', 'RGBA'))

    def test_code_path_is_processed_too(self):
        # admin forms, seed_demos and code all end in FieldFile.save()
        photo = Photo(invitation=self.inv)
        photo.image.save('x.jpg', ContentFile(jpeg_with_exif()))
        self.assertEqual(stored(photo.image).size, (800, 1200))
        self.assertTrue(ProcessedImage.objects.filter(name=photo.image.name).exists())

    def test_qris_is_cleaned_but_gets_no_lossy_renditions(self):
        acct = BankAccount(invitation=self.inv, account_type='qris', bank_name='QRIS', account_name='A')
        acct.qris_image.save('qris.jpg', ContentFile(jpeg_with_exif(size=(1200, 1200))))
        self.assertEqual(len(stored(acct.qris_image).getexif()), 0)
        self.assertEqual(ProcessedImage.objects.get(name=acct.qris_image.name).variants, {})

    def test_corrupt_and_oversized_images_are_refused(self):
        res = self.post_photo(b'\xff\xd8\xff\xe0' + b'not really a jpeg' * 20)
        self.assertEqual(res.status_code, 400)
        # Decompression bombs: DRF's own image check refuses them first; the
        # validator's pixel cap covers the paths that skip DRF.
        with mock.patch.object(Image, 'MAX_IMAGE_PIXELS', 1000):
            self.assertEqual(self.post_photo(jpeg_with_exif(size=(100, 100), rotate_tag=1)).status_code, 400)
            with self.assertRaisesMessage(Exception, 'megapiksel'):
                validate_image_upload(upload(jpeg_with_exif(size=(100, 100), rotate_tag=1)))

    def test_public_api_exposes_srcset_metadata(self):
        self.post_photo(jpeg_with_exif(size=(1200, 800), rotate_tag=1))
        photo = self.client.get(f'/api/invitations/{self.inv.slug}/').data['photos'][0]
        meta = photo['image_meta']
        self.assertEqual((meta['width'], meta['height']), (1200, 800))
        self.assertEqual(meta['fallback'], photo['image'])
        self.assertRegex(meta['srcset'], r'-w480\.webp 480w, .+-w960\.webp 960w, .+\.jpg 1200w$')


class BackfillCommandTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.inv = self.make_invitation(active=True)
        # A file stored before the pipeline existed: written straight to storage.
        name = default_storage.save('gallery/lama.jpg', ContentFile(jpeg_with_exif()))
        self.photo = Photo.objects.create(invitation=self.inv, image=name)

    def run_cmd(self, *args):
        out = StringIO()
        call_command('process_images', *args, stdout=out)
        return out.getvalue()

    def test_report_changes_nothing(self):
        out = self.run_cmd()
        self.assertIn('images 1', out)
        self.assertIn('with_exif 1', out)
        self.assertIn('unprocessed 1', out)
        self.assertGreater(len(stored(self.photo.image).getexif()), 0)

    def test_apply_strips_exif_and_builds_renditions(self):
        out = self.run_cmd('--apply')
        self.assertIn('processed_now 1', out)
        self.photo.refresh_from_db()
        img = stored(self.photo.image)
        self.assertEqual((img.size, len(img.getexif())), ((800, 1200), 0))
        self.assertEqual(sorted(ProcessedImage.objects.get(name=self.photo.image.name).variants), ['480'])   # 800px wide once upright
        self.assertIn('unprocessed 0', self.run_cmd())

    def test_a_file_shared_by_two_rows_is_processed_once(self):
        # ActivationRequest is a proxy of Invitation: the same hero row twice.
        name = default_storage.save('hero/lama.jpg', ContentFile(jpeg_with_exif()))
        type(self.inv).objects.filter(pk=self.inv.pk).update(hero_photo=name)
        out = self.run_cmd('--apply')
        self.assertIn('images 2', out)            # the gallery photo + the hero, once each
        self.assertIn('processed_now 2', out)
        rendition = ProcessedImage.objects.get(name=name).variants['480']
        self.assertEqual(rendition, 'hero/lama-w480.webp')   # no collision suffix
