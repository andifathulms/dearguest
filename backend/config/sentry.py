"""Sentry error tracking (Phase 5). Off unless SENTRY_DSN is set.

Nothing personal leaves the server: send_default_pii is off, request bodies
are never attached, and every event, transaction and breadcrumb passes the
PII scrubber (apps/invitations/pii.py) before it is sent. If Sentry is
unreachable the SDK drops events in the background; requests don't wait."""
import logging

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration


def init(dsn, release, environment, transport=None):
    from apps.invitations.pii import scrub_breadcrumb, scrub_event
    sentry_sdk.init(
        dsn=dsn,
        release=release,
        environment=environment,
        integrations=[DjangoIntegration(), LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)],
        traces_sample_rate=0.05,
        send_default_pii=False,
        max_request_body_size='never',
        include_local_variables=False,
        before_send=scrub_event,
        before_send_transaction=scrub_event,
        before_breadcrumb=scrub_breadcrumb,
        transport=transport,
    )
