"""Seed the load-test invitation on the prod-like stack (run through
`manage.py shell`): 500 guests on the floral demo, their codes written to
/tmp/codes.json for k6. Re-running replaces the previous load-test guests
and answers."""
import json

from apps.invitations.models import RSVP, Guest, Invitation

SLUG = 'demo-merah-anggur'
inv = Invitation.objects.get(slug=SLUG)
Guest.objects.filter(invitation=inv, group='loadtest').delete()
RSVP.objects.filter(invitation=inv, guest_name__startswith='Tamu Uji ').delete()
guests = [Guest(invitation=inv, name=f'Tamu Uji {i:03d}', group='loadtest') for i in range(500)]
for g in guests:
    g.save()
with open('/tmp/codes.json', 'w') as f:
    json.dump({'slug': SLUG, 'codes': [g.code for g in guests]}, f)
print(f'{len(guests)} guests on {SLUG}')
