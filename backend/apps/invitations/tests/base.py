"""Shared fixtures for the invitations test suite.

Uploaded files go to a throwaway MEDIA_ROOT so tests never touch the real
media folder (docker mounts ./media into the backend container)."""
import io
import shutil
import tempfile
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.invitations.models import Invitation, Couple

_MEDIA = tempfile.mkdtemp(prefix='dearguest-test-media-')


def png_bytes(size=(8, 8)):
    from PIL import Image
    buf = io.BytesIO()
    Image.new('RGB', size, (200, 120, 90)).save(buf, 'PNG')
    return buf.getvalue()


def png_upload(name='photo.png'):
    return SimpleUploadedFile(name, png_bytes(), content_type='image/png')


# A minimal MPEG-1 Layer III frame: sync word + header, padded to a frame.
MP3_BYTES = b'\xff\xfb\x90\x64' + b'\x00' * 413


def mp3_upload(name='song.mp3', data=MP3_BYTES):
    return SimpleUploadedFile(name, data, content_type='audio/mpeg')


@override_settings(MEDIA_ROOT=_MEDIA)
class APITestBase(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(_MEDIA, ignore_errors=True)

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def make_user(self, username='owner', **kw):
        return User.objects.create_user(username=username, password='x-Strong-pass-91', **kw)

    def make_invitation(self, owner=None, slug='andini-bagus', active=True, wedding_date=None, **kw):
        wedding_date = wedding_date or date.today() + timedelta(days=60)
        inv = Invitation.objects.create(
            slug=slug, couple_user=owner, is_active=active, wedding_date=wedding_date, **kw,
        )
        Couple.objects.create(
            invitation=inv, bride_name='Andini', bride_parents='-', groom_name='Bagus', groom_parents='-',
        )
        return inv

    def login(self, user):
        self.client.force_authenticate(user)
