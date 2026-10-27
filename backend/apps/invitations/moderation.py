"""Wish moderation: which new or edited wishes go straight to the wall and
which wait for the couple. Nothing is dropped; held wishes are `pending`."""
import re

# Links are the usual spam vector on a public wall, so they're always held.
LINK = re.compile(r'https?://|www\.|\b[\w-]+\.(?:com|id|net|org|co|xyz|ly|me|io|info|biz|site|link)\b', re.I)


def blocklist_terms(invitation):
    return [line.strip().lower() for line in (invitation.wish_blocklist or '').splitlines() if line.strip()]


def is_held(invitation, text):
    """True when the wish needs the couple's approval before it shows."""
    if not text.strip():
        return False
    if invitation.wishes_require_approval or LINK.search(text):
        return True
    lowered = text.lower()
    return any(term in lowered for term in blocklist_terms(invitation))


def status_for(invitation, text):
    return 'pending' if is_held(invitation, text) else 'visible'
