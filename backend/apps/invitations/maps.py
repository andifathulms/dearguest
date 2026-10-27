"""Map links for events: an "open in Maps" URL and an embeddable map URL.

No user-supplied URL is ever placed in an iframe: the embed is always built
here from the event's coordinates or its venue + address."""
from urllib.parse import quote_plus


def open_url(event):
    """Link for the "Buka Peta" button."""
    if event.lat is not None and event.lng is not None:
        return f'https://www.google.com/maps/search/?api=1&query={event.lat},{event.lng}'
    if (event.maps_link or '').startswith('https://'):
        return event.maps_link
    query = ', '.join(p for p in (event.venue_name, event.address) if p)
    return f'https://www.google.com/maps/search/?api=1&query={quote_plus(query)}' if query else ''


def embed_url(event):
    """Keyless Google Maps embed for the optional "Lihat Peta" iframe."""
    if event.lat is not None and event.lng is not None:
        q = f'{event.lat},{event.lng}'
    else:
        q = ', '.join(p for p in (event.venue_name, event.address) if p)
    return f'https://maps.google.com/maps?q={quote_plus(q)}&z=16&output=embed' if q else ''
