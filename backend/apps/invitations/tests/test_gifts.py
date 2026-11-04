"""Gift confirmations: guests post them, the couple lists, thanks and deletes."""
from apps.invitations.models import GiftConfirmation, Guest

from .base import APITestBase


class GuestPostsTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.url = f'/api/invitations/{self.inv.slug}/gift/'

    def test_new_invitations_have_the_form_and_the_payload_says_so(self):
        self.assertTrue(self.inv.gift_confirm)
        self.assertTrue(self.client.get(f'/api/invitations/{self.inv.slug}/').data['gift_confirm'])

    def test_guest_confirms_with_their_personal_code(self):
        guest = Guest.objects.create(invitation=self.inv, name='Budi')
        res = self.client.post(self.url, {
            'sender_name': ' Budi ', 'channel': 'BCA', 'amount': 500000, 'note': 'Selamat!', 'guest_code': guest.code.lower(),
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        gift = GiftConfirmation.objects.get()
        self.assertEqual((gift.sender_name, gift.channel, gift.amount, gift.guest), ('Budi', 'BCA', 500000, guest))

    def test_amount_is_optional_and_name_required(self):
        self.assertEqual(self.client.post(self.url, {'sender_name': 'Siti'}, format='json').status_code, 201)
        self.assertEqual(self.client.post(self.url, {'sender_name': '  '}, format='json').status_code, 400)
        self.assertEqual(self.client.post(self.url, {'sender_name': 'X', 'amount': 0}, format='json').status_code, 400)
        self.assertEqual(GiftConfirmation.objects.count(), 1)

    def test_switched_off_drafts_and_floods_are_refused(self):
        for _ in range(5):
            self.client.post(self.url, {'sender_name': 'A'}, format='json')
        self.assertEqual(self.client.post(self.url, {'sender_name': 'A'}, format='json').status_code, 429)

        self.inv.gift_confirm = False
        self.inv.save()
        self.assertEqual(self.client.post(self.url, {'sender_name': 'A'}, format='json').status_code, 404)
        draft = self.make_invitation(owner=self.owner, slug='draft', active=False)
        self.assertEqual(self.client.post(f'/api/invitations/{draft.slug}/gift/', {'sender_name': 'A'}, format='json').status_code, 404)


class CoupleListTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        guest = Guest.objects.create(invitation=self.inv, name='Budi', whatsapp='6281234567890', group='Kantor')
        self.gift = GiftConfirmation.objects.create(invitation=self.inv, guest=guest, sender_name='Budi', amount=300000)
        GiftConfirmation.objects.create(invitation=self.inv, sender_name='Siti', channel='Kado fisik')
        self.url = f'/api/my/invitations/{self.inv.slug}/gifts/'

    def test_owner_sees_the_list_and_totals(self):
        self.login(self.owner)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['stats'], {'count': 2, 'amount': 300000, 'unthanked': 2})
        budi = next(g for g in res.data['gifts'] if g['sender_name'] == 'Budi')
        self.assertEqual((budi['guest_group'], budi['guest_whatsapp']), ('Kantor', '6281234567890'))

    def test_mark_thanked_and_delete(self):
        self.login(self.owner)
        res = self.client.patch(f'{self.url}{self.gift.pk}/', {'thanked': True}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.data['thanked_at'])
        self.assertIsNone(self.client.patch(f'{self.url}{self.gift.pk}/', {'thanked': False}, format='json').data['thanked_at'])
        self.assertEqual(self.client.delete(f'{self.url}{self.gift.pk}/').status_code, 204)
        self.assertEqual(GiftConfirmation.objects.count(), 1)

    def test_strangers_get_404(self):
        self.login(self.make_user('other'))
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.client.patch(f'{self.url}{self.gift.pk}/', {'thanked': True}, format='json').status_code, 404)
