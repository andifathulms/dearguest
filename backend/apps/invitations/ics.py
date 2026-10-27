"""iCalendar (.ics) for one event, for guests on iPhone / Outlook.

Times are written as UTC instants (DTSTART:...Z), which every calendar shows
correctly in the guest's own zone without needing a VTIMEZONE block; the
event's zone is also given as X-WR-TIMEZONE for apps that display it."""
from datetime import timedelta, timezone as dt_timezone

from django.utils import timezone

from . import copy

DEFAULT_DURATION = timedelta(hours=2)


def _escape(text):
    # RFC 5545 §3.3.11: backslash, semicolon, comma and newlines are escaped.
    return (str(text).replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,')
            .replace('\r\n', '\\n').replace('\n', '\\n'))


def _fold(line):
    # RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + space.
    raw = line.encode('utf-8')
    if len(raw) <= 75:
        return line
    parts, current = [], b''
    for ch in line:
        b = ch.encode('utf-8')
        if len(current) + len(b) > (75 if not parts else 74):
            parts.append(current.decode('utf-8'))
            current = b''
        current += b
    parts.append(current.decode('utf-8'))
    return '\r\n '.join(parts)


def _utc(dt):
    return dt.astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')


def event_ics(event, invitation, host='dearguest', maps_url=''):
    couple = getattr(invitation, 'couple', None)
    names = f'{couple.bride_name} & {couple.groom_name}' if couple else invitation.slug
    label = copy.event_label(event.event_type, invitation.copy_variant, event.title)
    end = event.end or (event.start + DEFAULT_DURATION)
    location = ', '.join(p for p in (event.venue_name, event.address) if p)
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//DearGuest//Undangan Pernikahan//ID',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        f'X-WR-TIMEZONE:{event.timezone}',
        'BEGIN:VEVENT',
        f'UID:event-{event.pk}-{invitation.slug}@{host}',
        f'DTSTAMP:{_utc(timezone.now())}',
        f'DTSTART:{_utc(event.start)}',
        f'DTEND:{_utc(end)}',
        f'SUMMARY:{_escape(f"{label} — {names}")}',
        f'LOCATION:{_escape(location)}',
    ]
    if maps_url:
        lines.append(f'DESCRIPTION:{_escape(maps_url)}')
    lines += ['END:VEVENT', 'END:VCALENDAR']
    return '\r\n'.join(_fold(line) for line in lines) + '\r\n'
