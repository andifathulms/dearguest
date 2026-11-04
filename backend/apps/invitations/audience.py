"""Who sees which event.

An event with no `groups` is for every guest. One with groups (e.g.
["Keluarga"] for the akad, or "Sesi 1" / "Sesi 2" receptions by group) is
shown only on the personal links of guests in one of those groups. A general
link, the WhatsApp group message and the generic link preview show only the
events for everyone.

Group names are matched like people type them: case and repeated spaces
don't matter. The same rule is in frontend/src/utils/events.js."""


def norm(name):
    return ' '.join((name or '').split()).casefold()


def sees(groups, guest):
    """True if a guest (or None: a general link) may see an event with these groups."""
    if not groups:
        return True
    return guest is not None and norm(guest.group) in {norm(g) for g in groups}


def visible_events(events, guest):
    """Event model instances the guest sees, in their order."""
    return [e for e in events if sees(e.groups, guest)]


def for_guest(data, guest):
    """A serialized public invitation with the events this guest doesn't see
    removed. `groups` is dropped from every event: guests never see the
    couple's group names. Works on the cached payload, so it never changes
    what the serializer (or a cache of it) holds."""
    events = [
        {k: v for k, v in e.items() if k != 'groups'}
        for e in data.get('events', []) if sees(e.get('groups'), guest)
    ]
    return {**data, 'events': events}
