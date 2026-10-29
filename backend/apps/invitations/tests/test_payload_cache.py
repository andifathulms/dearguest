"""The cached invitation payload and wishes wall show edits immediately."""
from datetime import date, datetime, timedelta, timezone

from apps.invitations.models import RSVP, BankAccount, Event, Invitation, Photo, Story

from .base import APITestBase, png_upload


class PayloadCacheTests(APITestBase):
    def setUp(self):
        super().setUp()
        self.inv = self.make_invitation(slug='andini-bagus')
        self.url = '/api/invitations/andini-bagus/'

    def get(self):
        return self.client.get(self.url).data

    def test_second_request_is_served_from_cache(self):
        self.get()
        with self.assertNumQueries(1):   # the is-it-public check only
            self.get()

    def test_every_kind_of_edit_shows_on_the_next_request(self):
        self.get()
        self.inv.couple.bride_name = 'Andini Putri'
        self.inv.couple.save()
        self.assertEqual(self.get()['couple']['bride_name'], 'Andini Putri')
        Event.objects.create(invitation=self.inv, event_type='akad', venue_name='Masjid', address='-',
                             start=datetime(2026, 12, 12, 1, tzinfo=timezone.utc), is_primary=True)
        self.assertEqual(len(self.get()['events']), 1)
        Story.objects.create(invitation=self.inv, title='Kisah', description='-')
        self.assertEqual(len(self.get()['stories']), 1)
        photo = Photo.objects.create(invitation=self.inv, image=png_upload())
        self.assertEqual(len(self.get()['photos']), 1)
        photo.delete()
        self.assertEqual(len(self.get()['photos']), 0)
        BankAccount.objects.create(invitation=self.inv, bank_name='BCA', account_number='1', account_name='A')
        self.assertEqual(len(self.get()['bank_accounts']), 1)
        self.inv.dress_code = 'Batik'
        self.inv.save()
        self.assertEqual(self.get()['dress_code'], 'Batik')

    def test_deactivation_and_expiry_are_immediate(self):
        self.get()
        Invitation.objects.filter(pk=self.inv.pk).update(is_active=False)   # no signal: the check runs first anyway
        self.assertEqual(self.client.get(self.url).status_code, 403)
        Invitation.objects.filter(pk=self.inv.pk).update(is_active=True, expires_at=date.today() - timedelta(days=1))
        self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_new_and_moderated_wishes_show_on_the_next_poll(self):
        wishes = '/api/invitations/andini-bagus/wishes/'
        self.assertEqual(self.client.get(wishes).data['count'], 0)
        rsvp = RSVP.objects.create(invitation=self.inv, guest_name='Budi', attending=True, wishes='Selamat')
        self.assertEqual(self.client.get(wishes).data['count'], 1)
        rsvp.wish_status = 'hidden'
        rsvp.save()
        self.assertEqual(self.client.get(wishes).data['count'], 0)
