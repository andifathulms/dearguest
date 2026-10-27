"""Map links for events: validating what the couple pastes, an "open in Maps"
URL and an embeddable map URL.

No user-supplied URL is ever placed in an iframe: the embed is always built
here from the event's coordinates or its venue + address."""
import re
from decimal import ROUND_HALF_UP, Decimal
from urllib.parse import parse_qs, quote_plus, urlparse

EMBED_CODE_ERROR = 'Tempel link Google Maps, bukan kode embed.'
INVALID_ERROR = 'Tempel link dari Google Maps (Bagikan → Salin link) atau koordinat seperti -7.80, 110.36.'

COORDS = re.compile(r'^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$')
PLACE_PIN = re.compile(r'!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)')   # the place itself
VIEWPORT = re.compile(r'@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)')        # where the map was looking
SHORT_HOSTS = {'maps.app.goo.gl', 'goo.gl', 'g.co'}
GOOGLE_HOST = re.compile(r'^(?:www\.|maps\.)?google\.(?:com|co\.id)$')
SIX_PLACES = Decimal('0.000001')


class MapsInputError(ValueError):
    pass


def _coords(lat, lng):
    lat, lng = Decimal(lat), Decimal(lng)
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return lat.quantize(SIX_PLACES, ROUND_HALF_UP), lng.quantize(SIX_PLACES, ROUND_HALF_UP)


def _coords_from_url(url):
    for pattern in (PLACE_PIN, VIEWPORT):
        m = pattern.search(url)
        if m and (c := _coords(*m.groups())):
            return c
    params = parse_qs(urlparse(url).query)
    for key in ('q', 'query', 'll', 'destination'):
        for value in params.get(key, []):
            m = COORDS.match(value)
            if m and (c := _coords(*m.groups())):
                return c
    return None


def _is_maps_url(parsed):
    host = (parsed.hostname or '').lower()
    if host in ('maps.app.goo.gl', 'maps.google.com', 'maps.google.co.id'):
        return True
    if host in ('goo.gl', 'g.co'):
        return parsed.path.startswith(('/maps', '/kgs'))
    return bool(GOOGLE_HOST.match(host)) and parsed.path.startswith('/maps')


def normalise_maps_input(text):
    """What the couple pasted -> (link, lat, lng).

    Accepts a Google Maps share/place/search link (https:// optional) or
    "lat, lng". Coordinates are pulled from the link when it carries them
    (short links don't; the server never follows them). Raises MapsInputError
    with a message for the editor otherwise, including for pasted <iframe> code."""
    text = (text or '').strip()
    if not text:
        return '', None, None
    if '<' in text or 'iframe' in text.lower():
        raise MapsInputError(EMBED_CODE_ERROR)
    m = COORDS.match(text)
    if m:
        c = _coords(*m.groups())
        if not c:
            raise MapsInputError(INVALID_ERROR)
        return '', c[0], c[1]
    url = text if re.match(r'^https?://', text, re.I) else f'https://{text}'
    parsed = urlparse(url)
    if ' ' in url or not _is_maps_url(parsed):
        raise MapsInputError(INVALID_ERROR)
    url = parsed._replace(scheme='https', fragment='').geturl()
    lat, lng = _coords_from_url(url) or (None, None)
    return url, lat, lng


def _valid_link(event):
    try:
        return normalise_maps_input(event.maps_link)[0]
    except MapsInputError:   # rows saved before validation existed
        return ''


def open_url(event):
    """Link for the "Buka Peta" button: the couple's own Maps link (it opens
    the place card), else the coordinates, else a search for the venue."""
    link = _valid_link(event)
    if link:
        return link
    if event.lat is not None and event.lng is not None:
        return f'https://www.google.com/maps/search/?api=1&query={event.lat},{event.lng}'
    query = ', '.join(p for p in (event.venue_name, event.address) if p)
    return f'https://www.google.com/maps/search/?api=1&query={quote_plus(query)}' if query else ''


def embed_url(event):
    """Keyless Google Maps embed for the optional "Lihat Peta" iframe."""
    if event.lat is not None and event.lng is not None:
        q = f'{event.lat},{event.lng}'
    else:
        q = ', '.join(p for p in (event.venue_name, event.address) if p)
    return f'https://www.google.com/maps?q={quote_plus(q)}&z=16&output=embed' if q else ''
