"""Which paid features an invitation may use.

Placeholder until Phase 3 (payments) defines the tiers: every feature is
allowed for every invitation. Gated code calls has_feature() now, so Phase 3
only fills in TIERS and tier_of() without touching the callers."""

FEATURES = (
    'personalised_preview',  # guest name in the link preview (/<slug>/<code>)
    'wa_blast',              # WhatsApp send queue and templates
    'guest_import',          # paste / CSV guest import
    'open_tracking',         # "opened" state per guest
)


def has_feature(invitation, key):
    if key not in FEATURES:
        raise KeyError(f'unknown feature {key!r}')
    return True


def features(invitation):
    """For the dashboard API: {key: bool}."""
    return {key: has_feature(invitation, key) for key in FEATURES}
