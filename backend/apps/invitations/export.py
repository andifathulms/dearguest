"""Everything a couple's invitation holds, as one ZIP (right of access, and
"download it before it's deleted"): invitation.json, guests.csv, rsvps.csv
(with WhatsApp numbers), wishes.csv, events.csv and every uploaded file."""
import csv
import io
import json
import tempfile
import zipfile
from pathlib import PurePosixPath
from zoneinfo import ZoneInfo

from django.core.serializers.json import DjangoJSONEncoder

from .csv_export import TZ_LABEL, safe_cell


def _csv(header, rows):
    out = io.StringIO()
    out.write('﻿')   # Excel reads the accents
    writer = csv.writer(out)
    writer.writerow(header)
    for row in rows:
        writer.writerow([safe_cell(v) for v in row])
    return out.getvalue()


def _local(dt, tz='Asia/Jakarta'):
    return f"{dt.astimezone(ZoneInfo(tz)):%Y-%m-%d %H:%M} {TZ_LABEL.get(tz, tz)}" if dt else ''


def _files(inv):
    couple = getattr(inv, 'couple', None)
    singles = [('hero', inv.hero_photo), ('music', inv.music_file)]
    if couple:
        singles += [('profil', couple.bride_photo), ('profil', couple.groom_photo)]
    for folder, f in singles:
        if f:
            yield folder, f
    for photo in inv.photos.all():
        yield 'galeri', photo.image
    for bank in inv.bank_accounts.all():
        if bank.qris_image:
            yield 'qris', bank.qris_image


def build(inv, invitation_data):
    """A temporary file holding the ZIP (rewound), for FileResponse."""
    tmp = tempfile.SpooledTemporaryFile(max_size=32 * 1024 * 1024)
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('invitation.json', json.dumps(invitation_data, cls=DjangoJSONEncoder, ensure_ascii=False, indent=2))
        z.writestr('guests.csv', _csv(
            ['Nama', 'WhatsApp', 'Grup', 'Kode', 'Untuk (orang)', 'Terkirim', 'Dibuka (kali)', 'Pertama dibuka',
             'Terakhir dibuka', 'Hadir (check-in)'],
            ((g.name, g.whatsapp, g.group, g.code, g.max_pax or '', _local(g.sent_at), g.open_count,
              _local(g.first_opened_at), _local(g.last_opened_at), 'ya' if g.checked_in else '')
             for g in inv.guests.all())))
        rsvps = list(inv.rsvps.order_by('submitted_at', 'id'))
        z.writestr('rsvps.csv', _csv(
            ['Nama', 'WhatsApp', 'Kehadiran', 'Jumlah', 'Dikirim', 'Diperbarui'],
            ((r.guest_name, r.whatsapp, 'Hadir' if r.attending else 'Tidak hadir', r.pax if r.attending else 0,
              _local(r.submitted_at), _local(r.updated_at)) for r in rsvps)))
        z.writestr('wishes.csv', _csv(
            ['Nama', 'Ucapan', 'Status', 'Dikirim'],
            ((r.guest_name, r.wishes, r.wish_status, _local(r.submitted_at)) for r in rsvps if r.wishes)))
        z.writestr('events.csv', _csv(
            ['Acara', 'Judul', 'Mulai', 'Selesai', 'Tempat', 'Alamat'],
            ((e.event_type, e.title, _local(e.start, e.timezone), _local(e.end, e.timezone), e.venue_name, e.address)
             for e in inv.events.all())))
        seen = set()
        for folder, f in _files(inv):
            name = f'{folder}/{PurePosixPath(f.name).name}'
            if name in seen or not f.storage.exists(f.name):
                continue
            seen.add(name)
            with f.storage.open(f.name, 'rb') as fh:
                z.writestr(name, fh.read())
    tmp.seek(0)
    return tmp
