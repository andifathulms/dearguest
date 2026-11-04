"""Headcount for the caterer and the WO: per event (session) and per guest group.

An RSVP answers for the whole invitation, so a guest who said "hadir" counts
for every event they see (audience.py). Answers from a general link have no
group and only count for events that are for everyone.

For each row:
- invited: guests on the list who see it;
- attending / attending_pax: answered "hadir", and how many people;
- declined: answered "tidak hadir";
- awaiting / awaiting_pax: haven't answered, and at most how many people
  their invitations are for (their own limit, else 1);
- estimate_max = attending_pax + awaiting_pax: plan the food for this."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import audience
from .views import _owner_or_error


def _latest_answers(invitation):
    """{guest_id: rsvp} with each guest's newest answer, and the general-link answers."""
    by_guest, general = {}, []
    for rsvp in invitation.rsvps.all():   # newest first
        if rsvp.guest_id is None:
            general.append(rsvp)
        else:
            by_guest.setdefault(rsvp.guest_id, rsvp)
    return by_guest, general


def summarise(guests, answers, general=()):
    row = {'invited': len(guests), 'attending': 0, 'attending_pax': 0, 'declined': 0,
           'awaiting': 0, 'awaiting_pax': 0, 'general_pax': 0}
    for guest in guests:
        rsvp = answers.get(guest.id)
        if rsvp is None:
            row['awaiting'] += 1
            row['awaiting_pax'] += guest.max_pax or 1
        elif rsvp.attending:
            row['attending'] += 1
            row['attending_pax'] += rsvp.pax
        else:
            row['declined'] += 1
    for rsvp in general:
        if rsvp.attending:
            row['general_pax'] += rsvp.pax
    row['attending_pax'] += row['general_pax']
    row['estimate_max'] = row['attending_pax'] + row['awaiting_pax']
    return row


def headcount(invitation):
    guests = list(invitation.guests.filter(is_walk_in=False))   # walk-ins weren't expected
    answers, general = _latest_answers(invitation)

    events = []
    for event in invitation.events.all():
        seen_by = [g for g in guests if audience.sees(event.groups, g)]
        events.append({
            'id': event.id, 'event_type': event.event_type, 'title': event.title,
            'start': event.start, 'timezone': event.timezone, 'groups': event.groups,
            **summarise(seen_by, answers, () if event.groups else general),
        })

    groups = {}
    for guest in guests:
        key = audience.norm(guest.group)
        groups.setdefault(key, {'name': ' '.join(guest.group.split()), 'guests': []})['guests'].append(guest)
    group_rows = [
        {'name': g['name'], **summarise(g['guests'], answers)}
        for _, g in sorted(groups.items(), key=lambda kv: (kv[0] == '', kv[0]))
    ]
    return {'events': events, 'groups': group_rows, 'total': summarise(guests, answers, general)}


class HeadcountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        invitation, error = _owner_or_error(request, slug)
        if error:
            return error
        return Response(headcount(invitation))
