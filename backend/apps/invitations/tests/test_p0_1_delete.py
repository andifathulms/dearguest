"""p0-1: DELETE on the music-preset route must not delete the invitation;
owners get a real (guarded) DELETE on the invitation itself."""
from apps.invitations.models import Invitation, MusicPreset, RSVP, Guest, Photo

from .base import APITestBase, png_upload, mp3_upload


class MusicPresetDeleteTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        preset = MusicPreset.objects.create(title='Piano', audio=mp3_upload('preset.mp3'))
        self.inv.music_preset = preset
        self.inv.music_file = mp3_upload('own.mp3')
        self.inv.save()
        RSVP.objects.create(invitation=self.inv, guest_name='Budi', attending=True)
        Guest.objects.create(invitation=self.inv, name='Budi')
        Photo.objects.create(invitation=self.inv, image=png_upload())
        self.url = f'/api/my/invitations/{self.inv.slug}/music-preset/'

    def test_preset_delete_clears_music_and_keeps_everything_else(self):
        self.login(self.owner)
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, 200)
        inv = Invitation.objects.get(pk=self.inv.pk)
        self.assertIsNone(inv.music_preset)
        self.assertFalse(inv.music_file)
        self.assertEqual(inv.rsvps.count(), 1)
        self.assertEqual(inv.guests.count(), 1)
        self.assertEqual(inv.photos.count(), 1)

    def test_preset_delete_by_non_owner_is_refused(self):
        self.login(self.make_user('stranger'))
        res = self.client.delete(self.url)
        self.assertIn(res.status_code, (403, 404))
        inv = Invitation.objects.get(pk=self.inv.pk)
        self.assertIsNotNone(inv.music_preset)


class InvitationOwnerDeleteTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()

    def url(self, inv):
        return f'/api/my/invitations/{inv.slug}/'

    def test_owner_can_delete_a_free_draft(self):
        inv = self.make_invitation(owner=self.owner, active=False)
        self.login(self.owner)
        res = self.client.delete(self.url(inv))
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Invitation.objects.filter(pk=inv.pk).exists())

    def test_deleting_an_active_invitation_is_refused(self):
        inv = self.make_invitation(owner=self.owner, active=True)
        self.login(self.owner)
        res = self.client.delete(self.url(inv))
        self.assertEqual(res.status_code, 409)
        self.assertTrue(Invitation.objects.filter(pk=inv.pk).exists())

    def test_deleting_a_paid_draft_is_refused(self):
        inv = self.make_invitation(owner=self.owner, active=False, tier='premium')
        self.login(self.owner)
        res = self.client.delete(self.url(inv))
        self.assertEqual(res.status_code, 409)
        self.assertTrue(Invitation.objects.filter(pk=inv.pk).exists())

    def test_non_owner_cannot_delete(self):
        inv = self.make_invitation(owner=self.owner, active=False)
        self.login(self.make_user('stranger'))
        res = self.client.delete(self.url(inv))
        self.assertIn(res.status_code, (403, 404))
        self.assertTrue(Invitation.objects.filter(pk=inv.pk).exists())
