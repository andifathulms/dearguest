"""Photo filter preset: stored per invitation, editable by the owner, public."""
from apps.invitations.models import Invitation

from .base import APITestBase


class PhotoFilterTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, theme='sage')
        self.login(self.owner)

    def test_defaults_to_none_and_is_public(self):
        res = self.client.get(f'/api/invitations/{self.inv.slug}/')
        self.assertEqual(res.data['photo_filter'], 'none')

    def test_owner_can_pick_a_preset(self):
        for value in ('soft-warm', 'bw', 'none'):
            with self.subTest(value=value):
                res = self.client.patch(f'/api/my/invitations/{self.inv.slug}/', {'photo_filter': value}, format='json')
                self.assertEqual(res.status_code, 200, res.data)
                self.assertEqual(Invitation.objects.get(pk=self.inv.pk).photo_filter, value)
                self.assertEqual(res.data['photo_filter'], value)

    def test_unknown_preset_is_rejected(self):
        res = self.client.patch(f'/api/my/invitations/{self.inv.slug}/', {'photo_filter': 'sepia'}, format='json')
        self.assertEqual(res.status_code, 400)
