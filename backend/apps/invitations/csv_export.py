"""RSVP export for spreadsheets: UTF-8 with BOM (so Excel reads the accents),
proper quoting from the csv module, and a guard against formula injection --
a guest who types '=HYPERLINK(...)' as their name gets text, not a formula."""
import csv
import io
from zoneinfo import ZoneInfo

HEADER = ['Nama', 'Kode Tamu', 'Grup', 'Kehadiran', 'Jumlah', 'Ucapan', 'Dikirim', 'Diperbarui']
FORMULA_START = ('=', '+', '-', '@', '\t', '\r')
TZ_LABEL = {'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT'}


def safe_cell(value):
    text = '' if value is None else str(value)
    return f"'{text}" if text.startswith(FORMULA_START) else text


def _stamp(dt, tz_name):
    return f"{dt.astimezone(ZoneInfo(tz_name)):%Y-%m-%d %H:%M} {TZ_LABEL.get(tz_name, tz_name)}"


def rsvps_csv(invitation):
    """The invitation's answers as CSV text. Times use the primary event's zone."""
    primary = invitation.events.filter(is_primary=True).first()
    tz_name = primary.timezone if primary else 'Asia/Jakarta'
    out = io.StringIO()
    out.write('﻿')
    writer = csv.writer(out)
    writer.writerow(HEADER)
    for r in invitation.rsvps.select_related('guest').order_by('submitted_at', 'id'):
        writer.writerow([
            safe_cell(r.guest_name),
            safe_cell(r.guest.code if r.guest else ''),
            safe_cell(r.guest.group if r.guest else ''),
            'Hadir' if r.attending else 'Tidak Hadir',
            r.pax if r.attending else 0,
            safe_cell(r.wishes),
            _stamp(r.submitted_at, tz_name),
            _stamp(r.updated_at, tz_name),
        ])
    return out.getvalue()
