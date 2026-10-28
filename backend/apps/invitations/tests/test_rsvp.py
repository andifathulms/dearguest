"""RSVP: one answer per guest (by code, else by WhatsApp number), per-guest
pax limits, the CSV export, wish moderation, and the dedupe migration."""
import csv
import io
from datetime import datetime, timedelta, timezone as dt_timezone

from apps.invitations.models import RSVP, Event, Guest, normalise_whatsapp

from .base import APITestBase
from .migration_base import MigrationTestCase


class RsvpBase(APITestBase):
    def setUp(self):
        super().setUp()
        self.owner = self.make_user()
        self.inv = self.make_invitation(owner=self.owner, active=True)

    def answer(self, **kw):
        body = {'guest_name': 'Budi', 'attending': True, 'pax': 1, 'wishes': '', **kw}
        return self.client.post(f'/api/invitations/{self.inv.slug}/rsvp/', body, format='json')


class NormaliseWhatsappTests(APITestBase):
    def test_forms_of_one_number_agree(self):
        for raw in ('0812-3456-7890', '+62 812 3456 7890', '6281234567890', '81234567890'):
            with self.subTest(raw=raw):
                self.assertEqual(normalise_whatsapp(raw), '6281234567890')
        self.assertEqual(normalise_whatsapp('12'), '')
        self.assertEqual(normalise_whatsapp(''), '')


class UpsertTests(RsvpBase):
    def test_same_guest_code_updates_the_answer(self):
        guest = Guest.objects.create(invitation=self.inv, name='Budi')
        first = self.answer(guest_code=guest.code)
        self.assertEqual(first.status_code, 201)
        self.assertFalse(first.data['updated'])
        second = self.answer(guest_code=guest.code, attending=False)
        self.assertEqual(second.status_code, 200)
        self.assertTrue(second.data['updated'])
        self.assertEqual(RSVP.objects.count(), 1)
        self.assertFalse(RSVP.objects.get().attending)

    def test_same_whatsapp_in_another_format_updates_the_answer(self):
        self.answer(whatsapp='0812-3456-7890', pax=2)
        res = self.answer(whatsapp='+62 812 3456 7890', pax=3, guest_name='Budi S.')
        self.assertTrue(res.data['updated'])
        self.assertEqual(list(RSVP.objects.values_list('guest_name', 'pax')), [('Budi S.', 3)])

    def test_an_empty_wish_on_a_new_answer_keeps_the_earlier_wish(self):
        self.answer(whatsapp='08123456789', wishes='Selamat!')
        self.answer(whatsapp='08123456789', attending=False, wishes='')
        rsvp = RSVP.objects.get()
        self.assertEqual((rsvp.attending, rsvp.wishes), (False, 'Selamat!'))

    def test_no_code_and_no_number_always_creates(self):
        self.answer()
        self.answer()
        self.assertEqual(RSVP.objects.count(), 2)

    def test_two_guests_sharing_a_family_phone_keep_separate_answers(self):
        a = Guest.objects.create(invitation=self.inv, name='Ayah')
        b = Guest.objects.create(invitation=self.inv, name='Ibu')
        self.answer(guest_code=a.code, whatsapp='08123456789')
        self.answer(guest_code=b.code, whatsapp='08123456789')
        self.assertEqual(RSVP.objects.count(), 2)

    def test_stats_count_the_latest_answer_once(self):
        self.client.force_authenticate(self.owner)
        self.answer(whatsapp='08123456789', pax=4)
        self.answer(whatsapp='08123456789', pax=2)
        stats = self.client.get(f'/api/invitations/{self.inv.slug}/rsvps/').data['stats']
        self.assertEqual((stats['total_hadir'], stats['total_pax']), (1, 2))


class PaxLimitTests(RsvpBase):
    def test_guest_limit_is_enforced_server_side(self):
        guest = Guest.objects.create(invitation=self.inv, name='Budi', max_pax=2)
        res = self.answer(guest_code=guest.code, pax=3)
        self.assertEqual(res.status_code, 400)
        self.assertIn('2 orang', str(res.data['pax']))
        self.assertEqual(self.answer(guest_code=guest.code, pax=2).status_code, 201)

    def test_limit_ignores_pax_when_not_attending(self):
        guest = Guest.objects.create(invitation=self.inv, name='Budi', max_pax=1)
        self.assertEqual(self.answer(guest_code=guest.code, attending=False, pax=3).status_code, 201)

    def test_without_a_guest_the_invitation_wide_limit_applies(self):
        self.assertEqual(self.answer(pax=11).status_code, 400)
        self.assertEqual(self.answer(pax=10).status_code, 201)

    def test_public_guest_lookup_returns_only_name_and_limit(self):
        guest = Guest.objects.create(invitation=self.inv, name='Budi', max_pax=2, whatsapp='0812', group='Kantor')
        res = self.client.get(f'/api/invitations/{self.inv.slug}/guest/{guest.code}/')
        # The canonical code (for the clean URL), name and limit; no number, no group.
        self.assertEqual(res.data, {'code': guest.code, 'name': 'Budi', 'max_pax': 2})
        other = self.make_invitation(slug='lain', active=True)
        self.assertEqual(self.client.get(f'/api/invitations/{other.slug}/guest/{guest.code}/').status_code, 404)

    def test_owner_sets_max_pax_on_a_guest(self):
        self.client.force_authenticate(self.owner)
        guest = Guest.objects.create(invitation=self.inv, name='Budi')
        url = f'/api/invitations/{self.inv.slug}/guests/{guest.pk}/'
        self.assertEqual(self.client.patch(url, {'max_pax': 3}, format='json').data['max_pax'], 3)
        self.assertEqual(self.client.patch(url, {'max_pax': 0}, format='json').status_code, 400)


class CsvTests(RsvpBase):
    def setUp(self):
        super().setUp()
        Event.objects.create(invitation=self.inv, event_type='resepsi', start=datetime(2026, 12, 12, 3, tzinfo=dt_timezone.utc),
                             timezone='Asia/Makassar', venue_name='G', address='A', is_primary=True)
        guest = Guest.objects.create(invitation=self.inv, name='Budi', group='Kantor')
        self.answer(guest_code=guest.code, guest_name='=HYPERLINK("http://x")', wishes='Selamat, "semoga"\nsakinah', pax=2)
        self.answer(guest_name='Sari, S.Pd', attending=False, wishes='-tanpa formula')
        self.url = f'/api/invitations/{self.inv.slug}/rsvps.csv'

    def test_owner_only(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.client.force_authenticate(self.make_user(username='lain'))
        self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_bom_quoting_injection_guard_and_columns(self):
        self.client.force_authenticate(self.owner)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res['Content-Type'].startswith('text/csv'))
        text = res.content.decode('utf-8')
        self.assertTrue(text.startswith('﻿'))
        rows = list(csv.reader(io.StringIO(text.lstrip('﻿'))))
        self.assertEqual(rows[0], ['Nama', 'Kode Tamu', 'Grup', 'Kehadiran', 'Jumlah', 'Ucapan', 'Dikirim', 'Diperbarui'])
        budi, sari = rows[1], rows[2]
        self.assertEqual(budi[0], '\'=HYPERLINK("http://x")')
        self.assertEqual((budi[2], budi[3], budi[4]), ('Kantor', 'Hadir', '2'))
        self.assertEqual(budi[5], 'Selamat, "semoga"\nsakinah')   # comma, quotes, newline survive
        self.assertTrue(budi[6].endswith(' WITA'))                 # primary event's zone
        self.assertEqual((sari[0], sari[3], sari[4], sari[5]), ('Sari, S.Pd', 'Tidak Hadir', '0', "'-tanpa formula"))


class ModerationTests(RsvpBase):
    def wall(self):
        return [w['wishes'] for w in self.client.get(f'/api/invitations/{self.inv.slug}/wishes/').data['results']]

    def test_plain_wishes_show_and_links_are_held(self):
        self.assertEqual(self.answer(wishes='Selamat!').data['wish_status'], 'visible')
        self.assertEqual(self.answer(wishes='promo di www.judi.example').data['wish_status'], 'pending')
        self.assertEqual(self.answer(wishes='cek slot88.com').data['wish_status'], 'pending')
        self.assertEqual(self.wall(), ['Selamat!'])

    def test_blocklist_terms_hold_case_insensitively(self):
        self.inv.wish_blocklist = 'mantan\n  \nKATA KASAR'
        self.inv.save()
        self.assertEqual(self.answer(wishes='Salam dari Mantan').data['wish_status'], 'pending')
        self.assertEqual(self.answer(wishes='ini kata kasar').data['wish_status'], 'pending')
        self.assertEqual(self.answer(wishes='Barakallah').data['wish_status'], 'visible')

    def test_approval_mode_holds_everything(self):
        self.inv.wishes_require_approval = True
        self.inv.save()
        self.assertEqual(self.answer(wishes='Selamat!').data['wish_status'], 'pending')
        self.assertEqual(self.wall(), [])

    def test_owner_approves_hides_and_deletes(self):
        self.inv.wishes_require_approval = True
        self.inv.save()
        self.answer(wishes='Selamat!', whatsapp='08123456789')
        self.client.force_authenticate(self.owner)
        base = f'/api/my/invitations/{self.inv.slug}/wishes/'
        [wish] = self.client.get(base).data
        self.assertEqual(wish['wish_status'], 'pending')
        self.client.patch(f"{base}{wish['id']}/", {'wish_status': 'visible'}, format='json')
        self.assertEqual(self.wall(), ['Selamat!'])
        self.client.patch(f"{base}{wish['id']}/", {'wish_status': 'hidden'}, format='json')
        self.assertEqual(self.wall(), [])
        self.assertEqual(self.client.patch(f"{base}{wish['id']}/", {'wish_status': 'pending'}, format='json').status_code, 400)
        self.client.delete(f"{base}{wish['id']}/")
        rsvp = RSVP.objects.get()
        self.assertEqual((rsvp.wishes, rsvp.attending), ('', True))   # attendance answer kept

    def test_editing_a_hidden_wish_rechecks_it_and_unchanged_text_stays_hidden(self):
        self.answer(wishes='Selamat!', whatsapp='08123456789')
        RSVP.objects.update(wish_status='hidden')
        self.answer(wishes='Selamat!', whatsapp='08123456789', pax=2)
        self.assertEqual(RSVP.objects.get().wish_status, 'hidden')
        self.answer(wishes='Selamat ya!', whatsapp='08123456789')
        self.assertEqual(RSVP.objects.get().wish_status, 'visible')

    def test_another_owner_cannot_moderate(self):
        self.answer(wishes='Selamat!')
        pk = RSVP.objects.get().pk
        self.client.force_authenticate(self.make_user(username='lain'))
        res = self.client.patch(f'/api/my/invitations/{self.inv.slug}/wishes/{pk}/', {'wish_status': 'hidden'}, format='json')
        self.assertEqual(res.status_code, 404)


class RsvpDedupeMigrationTests(MigrationTestCase):
    migrate_from = '0036_rsvp_dedupe_moderation_guest_pax'
    migrate_to = '0038_rsvp_unique_answers'

    def setUpBeforeMigration(self, apps):
        RSVP = apps.get_model('invitations', 'RSVP')
        Guest = apps.get_model('invitations', 'Guest')
        inv = self.make_old_invitation(apps, slug='a')
        guest = Guest.objects.create(invitation=inv, name='Budi', code='abc12345')
        t0 = datetime(2026, 1, 1, tzinfo=dt_timezone.utc)

        def add(minutes, **kw):
            r = RSVP.objects.create(invitation=inv, guest_name='x', attending=True, **kw)
            RSVP.objects.filter(pk=r.pk).update(submitted_at=t0 + timedelta(minutes=minutes))

        add(0, guest=guest, pax=1)
        add(5, guest=guest, pax=3)                     # latest for the guest
        add(1, whatsapp='0812-3456-7890', pax=1)
        add(6, whatsapp='+6281234567890', pax=2)       # same number, latest
        add(2, pax=1)
        add(3, pax=1)                                  # anonymous rows are never merged

    def test_latest_answer_kept_per_guest_and_number(self):
        RSVP = self.apps.get_model('invitations', 'RSVP')
        self.assertEqual(RSVP.objects.count(), 4)
        self.assertEqual(RSVP.objects.get(guest__isnull=False).pax, 3)
        wa = RSVP.objects.get(whatsapp_norm='6281234567890')
        self.assertEqual(wa.pax, 2)
        self.assertEqual(wa.updated_at, wa.submitted_at)
