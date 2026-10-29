"""Upload re-check for every file field added since Phase 0: each one uses the
content-checking fields, and every way in (editor API and admin forms)
rejects HTML, SVG and oversized files."""
from django.apps import apps
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models
from django.forms import modelform_factory

from apps.invitations.models import BankAccount, MusicPreset, Photo
from apps.invitations.uploads import IMAGE_MAX_BYTES, SafeFileField, SafeImageField

from .base import APITestBase, png_bytes

HTML = b'<!doctype html><script>alert(document.cookie)</script>'
SVG = b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'
BAD = {
    'html': ('x.jpg', HTML, 'image/jpeg'),
    'svg': ('x.svg', SVG, 'image/svg+xml'),
    'oversize': ('big.png', png_bytes() + b'\x00' * (IMAGE_MAX_BYTES + 1), 'image/png'),
}


def bad(kind):
    name, data, ctype = BAD[kind]
    return SimpleUploadedFile(name, data, content_type=ctype)


class EveryFileFieldIsSafe(APITestBase):
    def test_project_models_use_the_checked_fields(self):
        fields = [
            f'{m._meta.label}.{f.name}'
            for m in apps.get_models() if m.__module__.startswith('apps.')
            for f in m._meta.get_fields() if isinstance(f, models.FileField)
        ]
        self.assertGreaterEqual(len(fields), 7)
        unsafe = [
            name for name in fields
            if not isinstance(apps.get_model(name.rsplit('.', 1)[0])._meta.get_field(name.rsplit('.', 1)[1]),
                              (SafeImageField, SafeFileField))
        ]
        self.assertEqual(unsafe, [])


class EveryUploadPathRejectsBadFiles(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.login(self.owner)
        self.photo = Photo.objects.create(invitation=self.inv, image=SimpleUploadedFile('p.png', png_bytes(), 'image/png'))
        self.bank = BankAccount.objects.create(invitation=self.inv, account_type='qris', bank_name='QRIS', account_name='A')

    def paths(self, f):
        slug = self.inv.slug
        return [
            ('hero_photo', 'patch', f'/api/my/invitations/{slug}/', {'hero_photo': f}),
            ('music_file', 'patch', f'/api/my/invitations/{slug}/', {'music_file': f}),
            ('bride_photo', 'put', f'/api/my/invitations/{slug}/couple/', {'bride_photo': f}),
            ('groom_photo', 'put', f'/api/my/invitations/{slug}/couple/', {'groom_photo': f}),
            ('gallery create', 'post', f'/api/my/invitations/{slug}/photos/', {'image': f}),
            ('gallery replace', 'patch', f'/api/my/invitations/{slug}/photos/{self.photo.pk}/', {'image': f}),
            ('qris create', 'post', f'/api/my/invitations/{slug}/bank-accounts/',
             {'account_type': 'qris', 'bank_name': 'QRIS', 'account_name': 'A', 'qris_image': f}),
            ('qris replace', 'patch', f'/api/my/invitations/{slug}/bank-accounts/{self.bank.pk}/', {'qris_image': f}),
        ]

    def test_editor_api(self):
        for kind in BAD:
            for name, method, url, data in self.paths(bad(kind)):
                with self.subTest(kind=kind, path=name):
                    res = getattr(self.client, method)(url, data, format='multipart')
                    self.assertEqual(res.status_code, 400, res.data)
        self.assertEqual(Photo.objects.count(), 1)

    def test_admin_forms(self):
        for model, field in ((MusicPreset, 'audio'), (Photo, 'image'), (BankAccount, 'qris_image')):
            form_class = modelform_factory(model, fields=[field])
            for kind in BAD:
                with self.subTest(model=model.__name__, kind=kind):
                    form = form_class(data={}, files={field: bad(kind)})
                    self.assertFalse(form.is_valid())
                    self.assertIn(field, form.errors)
