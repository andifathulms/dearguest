"""RSVP follow-up: the reminder template and the queue's reminded marker."""
from apps.invitations.models import RSVP, Guest

from .base import APITestBase


class FollowUpTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner)
        self.login(self.owner)

    def test_stats_count_who_is_still_awaited(self):
        sent = '2026-10-28T10:00:00Z'
        Guest.objects.create(invitation=self.inv, name='Belum dikirim')
        Guest.objects.create(invitation=self.inv, name='Dikirim', sent_at=sent)
        Guest.objects.create(invitation=self.inv, name='Diingatkan', sent_at=sent, reminded_at=sent)
        answered = Guest.objects.create(invitation=self.inv, name='Menjawab', sent_at=sent)
        RSVP.objects.create(invitation=self.inv, guest=answered, guest_name='Menjawab', attending=True)

        stats = self.client.get(f'/api/invitations/{self.inv.slug}/guests/').data['stats']
        self.assertEqual((stats['awaiting_reply'], stats['reminded'], stats['responded']), (2, 1, 1))

    def test_queue_marks_a_guest_reminded_and_can_undo(self):
        guest = Guest.objects.create(invitation=self.inv, name='Andi', sent_at='2026-10-28T10:00:00Z')
        url = f'/api/invitations/{self.inv.slug}/guests/{guest.id}/'
        res = self.client.patch(url, {'reminded_at': '2026-11-02T10:00:00Z'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.data['reminded_at'])
        self.assertIsNone(self.client.patch(url, {'reminded_at': None}, format='json').data['reminded_at'])

    def test_couple_can_save_a_reminder_template(self):
        url = f'/api/my/invitations/{self.inv.slug}/'
        res = self.client.patch(url, {'wa_templates': {'reminder': 'Halo {nama}, {link}'}}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['wa_templates'], {'reminder': 'Halo {nama}, {link}'})
        # Choosing the reminder as the invitation template isn't allowed.
        self.assertEqual(self.client.patch(url, {'wa_templates': {'active': 'reminder'}}, format='json').status_code, 400)
