"""Guest list import. The dashboard parses the paste/CSV and shows a preview;
this is the authority: it normalises again and skips the same rows the
preview flags (frontend/src/utils/guestImport.js mirrors these rules)."""
import re

from django.db import transaction

from .models import MAX_PAX, Guest, normalise_whatsapp

MAX_ROWS = 1000
SKIP_BLANK = 'Nama kosong'
SKIP_BAD_NUMBER = 'Nomor WhatsApp tidak valid'
SKIP_DUP_NUMBER = 'Nomor sudah ada'
SKIP_DUP_NAME = 'Nama sudah ada'


def _clean(value, limit):
    return re.sub(r'\s+', ' ', str(value or '')).strip()[:limit]


def _pax(value):
    try:
        n = int(str(value).strip())
    except (TypeError, ValueError):
        return None
    return n if 1 <= n <= MAX_PAX else None


def import_guests(invitation, rows):
    """Create guests from `rows` ([{name, whatsapp, group, max_pax}]).
    Returns (created guests, [{row, name, reason}] for skipped rows)."""
    numbers = {normalise_whatsapp(w) for w in invitation.guests.values_list('whatsapp', flat=True)} - {''}
    names = {n.casefold() for n in invitation.guests.values_list('name', flat=True)}
    to_create, skipped = [], []
    for i, row in enumerate(rows):
        row = row if isinstance(row, dict) else {}
        name = _clean(row.get('name'), 200)
        raw = _clean(row.get('whatsapp'), 40)
        number = normalise_whatsapp(raw)
        reason = None
        if not name:
            reason = SKIP_BLANK
        elif raw and not number:
            reason = SKIP_BAD_NUMBER
        elif number and number in numbers:
            reason = SKIP_DUP_NUMBER
        elif name.casefold() in names:
            reason = SKIP_DUP_NAME
        if reason:
            if name or raw:   # wholly blank rows aren't worth reporting
                skipped.append({'row': i + 1, 'name': name, 'reason': reason})
            continue
        names.add(name.casefold())
        if number:
            numbers.add(number)
        to_create.append(Guest(
            invitation=invitation, name=name, whatsapp=number,
            group=_clean(row.get('group'), 100), max_pax=_pax(row.get('max_pax')),
        ))
    with transaction.atomic():
        for guest in to_create:
            guest.save()   # save() assigns the per-invitation code
    return to_create, skipped
