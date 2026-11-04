"""Deleting guests' personal data after the wedding (UU PDP 27/2022).

RETENTION_DAYS after `expires_at` an invitation's guest list (with open
tracking), RSVPs and wishes, gallery / hero / couple photos, music, bank
accounts (QRIS images included), gift address and phone, and generated link
previews are deleted from the database and from storage. The invitation row,
the couple's names and their story stay, so the dashboard can say what
happened; the public page already says "berakhir".

The couple is emailed RETENTION_NOTICE_DAYS before, with a link to download
everything first; deletion waits until that notice is a week old (or the
couple has no email address). Logs carry counts only, never names."""
import logging
import shutil
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import BankAccount, Guest, Invitation, Photo, RSVP

log = logging.getLogger('dearguest.retention')


def deletion_date(invitation):
    return invitation.expires_at + timedelta(days=settings.RETENTION_DAYS)


def _has_email(inv):
    return bool(inv.couple_user and inv.couple_user.email)


def due_for_notice(today):
    first_notice_day = today + timedelta(days=settings.RETENTION_NOTICE_DAYS)
    return (Invitation.objects.select_related('couple_user')
            .filter(purged_at__isnull=True, purge_notice_sent_at__isnull=True,
                    expires_at__lte=first_notice_day - timedelta(days=settings.RETENTION_DAYS)))


def due_for_purge(today, now):
    candidates = (Invitation.objects.select_related('couple_user')
                  .filter(purged_at__isnull=True, expires_at__lte=today - timedelta(days=settings.RETENTION_DAYS)))
    notice_age = now - timedelta(days=settings.RETENTION_NOTICE_DAYS)
    return [inv for inv in candidates
            if not _has_email(inv) or (inv.purge_notice_sent_at and inv.purge_notice_sent_at <= notice_age)]


def send_notice(inv):
    when = deletion_date(inv)
    send_mail(
        'Data undangan kalian akan dihapus — DearGuest',
        f"Halo {inv.couple_user.username},\n\n"
        f"Sesuai kebijakan privasi kami, data tamu undangan /{inv.slug} (daftar tamu, konfirmasi kehadiran, "
        f"ucapan, foto, musik dan rekening) akan dihapus permanen mulai {when:%d-%m-%Y}.\n\n"
        f"Ingin menyimpannya? Unduh semua data lebih dulu di dashboard:\n"
        f"{settings.FRONTEND_URL}/dashboard/{inv.slug}\n\nTerima kasih telah menggunakan DearGuest.",
        settings.DEFAULT_FROM_EMAIL, [inv.couple_user.email],
    )


def purge(inv):
    """Delete one invitation's personal data. Returns counts (no names)."""
    counts = {}
    with transaction.atomic():
        for label, qs in (('guests', Guest.objects.filter(invitation=inv)),
                          ('rsvps', RSVP.objects.filter(invitation=inv)),
                          ('photos', Photo.objects.filter(invitation=inv)),
                          ('bank_accounts', BankAccount.objects.filter(invitation=inv))):
            counts[label] = qs.count()
            qs.delete()   # post_delete signals remove the files after commit
        files = 0
        couple = getattr(inv, 'couple', None)
        if couple:
            for field in ('bride_photo', 'groom_photo'):
                if getattr(couple, field):
                    setattr(couple, field, None)
                    files += 1
            couple.save()   # pre_save signal removes the old files
        for field in ('hero_photo', 'music_file'):
            if getattr(inv, field):
                setattr(inv, field, None)
                files += 1
        inv.gift_address = ''
        inv.gift_phone = ''
        inv.purged_at = timezone.now()
        inv.save()
        counts['single_files'] = files
    og_dir = Path(settings.MEDIA_ROOT) / 'og' / inv.slug
    if og_dir.is_dir():
        shutil.rmtree(og_dir, ignore_errors=True)
        counts['og_previews'] = 1
    return counts


def delete_invitation(inv):
    """Delete an invitation outright (account deletion): rows cascade, the
    file signals remove every upload, and the link previews go too."""
    slug = inv.slug
    with transaction.atomic():
        purge(inv)   # removes the files of rows that cascade below
        inv.delete()
    og_dir = Path(settings.MEDIA_ROOT) / 'og' / slug
    if og_dir.is_dir():
        shutil.rmtree(og_dir, ignore_errors=True)
