"""The backoffice's numbers: what /backoffice (the staff app, frontend
src/backoffice/) shows, as plain JSON-ready data. Read-only; what staff do
lives in staff_actions.py, the API in staff_views.py.

Theme demo invitations (seed_demos) are left out of every count. Revenue is
only for users with `invitations.view_payment` (the owner); callers check
can_see_revenue() before adding money to a response."""
import shutil
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.db.models import Count, OuterRef, Q, Subquery, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from . import health, ops, retention, themes
from .models import AbuseReport, ActivityEvent, Coupon, FunnelEvent, Guest, Invitation, Payment, Photo, RSVP, Event

WATCH_DAYS_OVERVIEW = 7
WATCH_DAYS = 14
PAGE_SIZE = 25


def can_see_revenue(user):
    return user.has_perm('invitations.view_payment')


def _demo_slugs():
    return {t['demoSlug'] for t in themes.entries().values() if t.get('demoSlug')}


def real_invitations():
    return Invitation.objects.exclude(slug__in=_demo_slugs())


def theme_name(theme_id):
    return (themes.get(theme_id) or {}).get('name', theme_id)


def names(inv):
    couple = getattr(inv, 'couple', None)
    if couple and (couple.bride_name or couple.groom_name):
        return f'{couple.bride_name} & {couple.groom_name}'
    return ''


def iso(value):
    return value.isoformat() if value else None


def paginate(qs, request, size=PAGE_SIZE):
    """({count, page, pages}, the page's rows) from ?page=."""
    count = qs.count()
    pages = max(1, -(-count // size))
    try:
        page = min(max(1, int(request.GET.get('page', 1))), pages)
    except ValueError:
        page = 1
    return {'count': count, 'page': page, 'pages': pages}, qs[(page - 1) * size: page * size]


# ---- invitation status ----

# An invitation's place in its life: (key, label). The first match wins.
STATUSES = [
    ('purged', 'Data dihapus'),
    ('expired', 'Berakhir'),
    ('live', 'Aktif'),
    ('requested', 'Minta aktivasi'),
    ('draft', 'Draf'),
]


def status_filter(key, today=None):
    today = today or timezone.localdate()
    not_over = Q(purged_at__isnull=True) & (Q(expires_at__isnull=True) | Q(expires_at__gte=today))
    return {
        'purged': Q(purged_at__isnull=False),
        'expired': Q(purged_at__isnull=True, expires_at__lt=today),
        'live': not_over & Q(is_active=True),
        'requested': not_over & Q(is_active=False, activation_requested=True),
        'draft': not_over & Q(is_active=False, activation_requested=False),
    }[key]


def invitation_status(inv, today=None):
    today = today or timezone.localdate()
    if inv.purged_at:
        return 'purged'
    if inv.expires_at and inv.expires_at < today:
        return 'expired'
    if inv.is_active:
        return 'live'
    return 'requested' if inv.activation_requested else 'draft'


def _per_invitation(model, value=Count('pk'), **filters):
    """A count (or sum) of an invitation's child rows, as a subquery so several
    of them don't multiply each other's joins."""
    rows = (model.objects.filter(invitation=OuterRef('pk'), **filters).order_by()
            .values('invitation').annotate(n=value).values('n'))
    return Coalesce(Subquery(rows), 0)


def with_counts(qs):
    return qs.annotate(
        n_guests=_per_invitation(Guest), n_sent=_per_invitation(Guest, sent_at__isnull=False),
        n_rsvps=_per_invitation(RSVP), n_opens=_per_invitation(Guest, Sum('open_count')),
        n_events=_per_invitation(Event), n_photos=_per_invitation(Photo),
    )


def missing(inv):
    """What a couple usually still has to do before sending."""
    return [label for ok, label in (
        (bool(names(inv).strip(' &')), 'nama'), (inv.n_events > 0, 'acara'),
        (inv.n_photos > 0 or bool(inv.hero_photo), 'foto'), (inv.n_guests > 0, 'tamu'),
    ) if not ok]


def _whatsapp(inv):
    profile = getattr(inv.couple_user, 'profile', None) if inv.couple_user else None
    return {'number': profile.whatsapp, 'intl': profile.whatsapp_intl} if profile and profile.whatsapp else None


def invitation_row(inv, today=None):
    return {
        'id': inv.pk, 'slug': inv.slug, 'names': names(inv), 'status': invitation_status(inv, today),
        'theme': inv.theme, 'theme_name': theme_name(inv.theme), 'tier': inv.tier,
        'wedding_date': iso(inv.wedding_date), 'expires_at': iso(inv.expires_at),
        'guests': inv.n_guests, 'sent': inv.n_sent, 'rsvps': inv.n_rsvps, 'opens': inv.n_opens,
        'missing': missing(inv), 'watermark': inv.watermark, 'activation_code': inv.activation_code,
        'activation_requested_at': iso(inv.activation_requested_at), 'activated_at': iso(inv.activated_at),
        'created_at': iso(inv.created_at), 'updated_at': iso(inv.updated_at),
        'owner': inv.couple_user.username if inv.couple_user else None, 'whatsapp': _whatsapp(inv),
    }


def invitations(request):
    today = timezone.localdate()
    qs = with_counts(real_invitations().select_related('couple', 'couple_user__profile')).order_by('-created_at')
    status, q = request.GET.get('status', ''), request.GET.get('q', '').strip()
    if status in dict(STATUSES):
        qs = qs.filter(status_filter(status, today))
    if request.GET.get('tier') in dict(Invitation.TIER_CHOICES):
        qs = qs.filter(tier=request.GET['tier'])
    if request.GET.get('theme'):
        qs = qs.filter(theme=request.GET['theme'])
    if q:
        qs = qs.filter(Q(slug__icontains=q) | Q(couple__bride_name__icontains=q) | Q(couple__groom_name__icontains=q)
                       | Q(couple_user__username__icontains=q) | Q(couple_user__email__icontains=q))
    meta, rows = paginate(qs, request)
    counts = {key: real_invitations().filter(status_filter(key, today)).count() for key, _ in STATUSES}
    return {**meta, 'results': [invitation_row(inv, today) for inv in rows], 'status_counts': counts}


def invitation_detail(inv, user):
    inv = with_counts(Invitation.objects.select_related('couple', 'couple_user__profile')).get(pk=inv.pk)
    events = [{'title': e.title or e.get_event_type_display(), 'start': iso(e.start), 'venue': e.venue_name}
              for e in inv.events.order_by('start')]
    detail = {
        **invitation_row(inv), 'events': events,
        'pax': RSVP.objects.filter(invitation=inv, attending=True).aggregate(n=Sum('pax'))['n'] or 0,
        'wishes_held': RSVP.objects.filter(invitation=inv, wish_status='pending').count(),
        'usher_enabled': inv.usher_enabled,
        'reports': [report_row(r) for r in inv.reports.all()[:10]],
        'feed': feed_rows(ActivityEvent.objects.filter(invitation=inv).select_related('invitation', 'user')[:20]),
    }
    if can_see_revenue(user):
        detail['payments'] = [payment_row(p) for p in inv.payments.select_related('coupon', 'recorded_by')]
    return detail


# ---- activity feed ----

def describe(ev):
    """One line for the feed, in Indonesian. Only ids and meta, never personal data."""
    m = ev.meta or {}
    if ev.kind == 'register':
        return 'Pasangan baru daftar' + (f' via {m["source"]}' if m.get('source') else '')
    if ev.kind == 'invitation_created':
        return f'Undangan baru · {theme_name(m.get("theme", ""))}'
    if ev.kind == 'theme_changed':
        return f'Ganti tema {theme_name(m.get("old", ""))} → {theme_name(m.get("new", ""))}'
    if ev.kind == 'activation_requested':
        return 'Minta aktivasi'
    if ev.kind == 'activated':
        return 'Kode dimasukkan, undangan aktif'
    if ev.kind == 'guests_imported':
        return f'{m.get("count", 0)} tamu diimpor'
    if ev.kind == 'exported':
        return 'Data diekspor (ZIP)'
    if ev.kind == 'account_deleted':
        return 'Akun dan undangannya dihapus'
    if ev.kind == 'staff_action':
        who = ev.user.username if ev.user else 'staf'
        return f'{who}: {m.get("action", "")}'
    return ev.get_kind_display()


def feed_rows(events):
    return [{'id': ev.pk, 'at': iso(ev.created_at), 'kind': ev.kind, 'kind_label': ev.get_kind_display(),
             'actor': ev.actor, 'text': describe(ev), 'slug': ev.invitation.slug if ev.invitation else None,
             'invitation_id': ev.invitation_id} for ev in events]


def activity_feed(request):
    qs = ActivityEvent.objects.select_related('invitation', 'user')
    kind, slug = request.GET.get('kind', ''), request.GET.get('slug', '').strip()
    if kind:
        qs = qs.filter(kind=kind)
    if slug:
        qs = qs.filter(invitation__slug__icontains=slug)
    meta, rows = paginate(qs, request, 50)
    return {**meta, 'results': feed_rows(rows), 'kinds': [{'key': k, 'label': v} for k, v in ActivityEvent.KINDS]}


# ---- wedding-day watch ----

def wedding_watch(days, today=None):
    """Weddings from today to `days` ahead, with what's ready and what isn't."""
    today = today or timezone.localdate()
    qs = (with_counts(real_invitations().select_related('couple'))
          .filter(wedding_date__gte=today, wedding_date__lte=today + timedelta(days=days)).order_by('wedding_date'))
    rows = []
    for inv in qs:
        answers = RSVP.objects.filter(invitation=inv)
        flags = []
        if not inv.is_active:
            flags.append({'tone': 'bad', 'text': 'belum aktif'})
        if not inv.n_events:
            flags.append({'tone': 'bad', 'text': 'tanpa acara'})
        if inv.n_guests and not inv.n_sent:
            flags.append({'tone': 'warn', 'text': 'belum dikirim ke tamu'})
        if inv.n_guests >= 100 and not inv.usher_enabled:
            flags.append({'tone': 'warn', 'text': 'penerima tamu belum aktif'})
        rows.append({
            'id': inv.pk, 'slug': inv.slug, 'names': names(inv), 'wedding_date': iso(inv.wedding_date),
            'days_left': (inv.wedding_date - today).days, 'guests': inv.n_guests, 'sent': inv.n_sent,
            'rsvps': inv.n_rsvps, 'pax': answers.filter(attending=True).aggregate(n=Sum('pax'))['n'] or 0,
            'checked_in': (Guest.objects.filter(invitation=inv, checked_in=True).count()
                           if inv.wedding_date == today else None),
            'usher': inv.usher_enabled, 'flags': flags,
        })
    return rows


# ---- overview ----

def overview(user):
    now = timezone.now()
    today = timezone.localdate()
    week_ago, two_weeks_ago = now - timedelta(days=7), now - timedelta(days=14)
    invs = real_invitations()
    pending = invs.filter(activation_requested=True, is_active=False)
    couples = User.objects.filter(is_staff=False)
    live = invs.filter(status_filter('live', today))
    rsvps = RSVP.objects.filter(invitation__in=invs)
    held = rsvps.filter(wish_status='pending')

    numbers = {
        'pending_activations': pending.count(),
        'oldest_pending_at': iso(pending.order_by('activation_requested_at')
                                 .values_list('activation_requested_at', flat=True).first()),
        'signups_week': couples.filter(date_joined__gte=week_ago).count(),
        'signups_prev_week': couples.filter(date_joined__gte=two_weeks_ago, date_joined__lt=week_ago).count(),
        'live': live.count(),
        'live_by_tier': dict(live.values_list('tier').annotate(n=Count('id'))),
        'new_invitations_week': invs.filter(created_at__gte=week_ago).count(),
        'activated_week': invs.filter(activated_at__gte=week_ago).count(),
        'rsvps_week': rsvps.filter(submitted_at__gte=week_ago).count(),
        'rsvps_prev_week': rsvps.filter(submitted_at__gte=two_weeks_ago, submitted_at__lt=week_ago).count(),
        'wishes_held': held.count(),
        'wishes_held_invitations': held.values('invitation').distinct().count(),
        'reports_new': AbuseReport.objects.filter(status='new').count(),
    }
    if can_see_revenue(user):
        month = timezone.localtime(now).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        paid = Payment.objects.filter(created_at__gte=month).aggregate(total=Sum('amount'), n=Count('id'))
        numbers.update(revenue_month=paid['total'] or 0, payments_month=paid['n'])

    monday = today - timedelta(days=today.weekday())
    counts = dict(FunnelEvent.objects.filter(week=monday).values_list('step').annotate(n=Count('id')))
    return {
        'numbers': numbers,
        'funnel': {'week': iso(monday), 'steps': [
            {'key': key, 'label': label, 'n': counts.get(key, 0), 'pending': key in ('checkout', 'paid')}
            for key, label in FunnelEvent.STEPS]},
        'watch': wedding_watch(WATCH_DAYS_OVERVIEW, today), 'watch_days': WATCH_DAYS_OVERVIEW,
        'feed': feed_rows(ActivityEvent.objects.select_related('invitation', 'user')[:10]),
        'system': system_summary(),
    }


# ---- system ----

def _checks(with_storage=False):
    checks = [('database', 'Database', health._check(health._db)), ('cache', 'Cache (Redis)', health._check(health._cache))]
    if with_storage:
        checks.append(('storage', 'Penyimpanan', health._check(health._storage)))
    checks += [('disk', 'Disk', health._check(health._disk, True)),
               ('certificate', 'Sertifikat', health._check(health._cert, True))]
    try:
        usage = shutil.disk_usage(settings.MEDIA_ROOT)
        disk = round(usage.used / usage.total * 100)
    except OSError:   # the disk check above already reports it as failed
        disk = None
    cert_days = cache.get('ops:cert_days')
    details = {'disk': f'{disk}% terpakai' if disk is not None else '',
               'certificate': f'{cert_days} hari lagi' if cert_days is not None else 'belum dicek'}
    return [{'key': key, 'name': name, 'ok': c['ok'],
             'detail': details.get(key) or ('' if c['ok'] else c.get('error', ''))} for key, name, c in checks]


def _jobs():
    now = timezone.now()
    rows = []
    for job, limit in health.JOBS.items():
        last = ops.last_run(job)
        rows.append({'job': job, 'last': iso(last), 'ok': bool(last) and now - last <= limit})
    return rows


def system_summary():
    return {'checks': _checks(), 'jobs': _jobs(), 'release': settings.RELEASE}


def system():
    now = timezone.now()
    today = timezone.localdate()
    return {
        'checks': _checks(with_storage=True), 'jobs': _jobs(), 'release': settings.RELEASE,
        'retention': {
            'expiring_week': real_invitations().filter(is_active=True, expires_at__gte=today,
                                                       expires_at__lte=today + timedelta(days=7)).count(),
            'notices_due': retention.due_for_notice(today).count(),
            'purges_due': len(retention.due_for_purge(today, now)),
            'activity_rows': ActivityEvent.objects.count(),
        },
    }


# ---- activations, couples, wishes, reports ----

def activations():
    """Pending requests, each with the voucher the couple pasted and the paid
    plans' prices after it."""
    from . import vouchers
    qs = (real_invitations().select_related('couple', 'couple_user__profile')
          .filter(activation_requested=True, is_active=False).order_by('activation_requested_at'))
    rows = []
    for inv in with_counts(qs):
        use = vouchers.current(inv)
        rows.append({**invitation_row(inv), 'prices': vouchers.prices(use.coupon if use else None),
                     'voucher': {'id': use.coupon_id, **vouchers.public_data(use.coupon)} if use else None})
    return rows


def couples(request, user):
    qs = (User.objects.filter(is_staff=False).select_related('profile')
          .prefetch_related('invitations').order_by('-date_joined'))
    q = request.GET.get('q', '').strip()
    if q:
        qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q) | Q(profile__whatsapp__icontains=q)
                       | Q(invitations__slug__icontains=q)).distinct()
    meta, rows = paginate(qs, request)
    revenue = can_see_revenue(user)
    paid = {}
    if revenue:
        paid = dict(Payment.objects.filter(invitation__couple_user__in=[u.pk for u in rows])
                    .values_list('invitation__couple_user').annotate(n=Sum('amount')))
    today = timezone.localdate()
    results = []
    for u in rows:
        profile = getattr(u, 'profile', None)
        row = {'id': u.pk, 'username': u.username, 'email': u.email, 'joined': iso(u.date_joined),
               'last_login': iso(u.last_login), 'whatsapp': profile.whatsapp if profile else '',
               'whatsapp_intl': profile.whatsapp_intl if profile else '',
               'max_invitations': profile.max_invitations if profile else 1,
               'invitations': [{'id': inv.pk, 'slug': inv.slug, 'status': invitation_status(inv, today)}
                               for inv in u.invitations.all()]}
        if revenue:
            row['paid'] = paid.get(u.pk, 0)
        results.append(row)
    return {**meta, 'results': results}


def wishes(request):
    qs = RSVP.objects.select_related('invitation').exclude(wishes='').order_by('-submitted_at')
    status, q = request.GET.get('status', ''), request.GET.get('q', '').strip()
    if status in dict(RSVP.WISH_STATUSES):
        qs = qs.filter(wish_status=status)
    if q:
        qs = qs.filter(Q(invitation__slug__icontains=q) | Q(guest_name__icontains=q) | Q(wishes__icontains=q))
    meta, rows = paginate(qs, request)
    return {**meta, 'results': [{
        'id': r.pk, 'guest_name': r.guest_name, 'slug': r.invitation.slug, 'invitation_id': r.invitation_id,
        'wishes': r.wishes, 'wish_status': r.wish_status, 'submitted_at': iso(r.submitted_at),
    } for r in rows]}


def report_row(r):
    return {'id': r.pk, 'url': r.url, 'reporter': r.reporter, 'reason': r.reason, 'reason_label': r.get_reason_display(),
            'details': r.details, 'status': r.status, 'status_label': r.get_status_display(),
            'decision_note': r.decision_note, 'decided_by': r.decided_by.username if r.decided_by else None,
            'decided_at': iso(r.decided_at), 'created_at': iso(r.created_at),
            'slug': r.invitation.slug if r.invitation else None, 'invitation_id': r.invitation_id,
            'invitation_active': r.invitation.is_active if r.invitation else None}


def reports(request):
    qs = AbuseReport.objects.select_related('invitation', 'decided_by')
    if request.GET.get('status') in dict(AbuseReport.STATUSES):
        qs = qs.filter(status=request.GET['status'])
    meta, rows = paginate(qs, request)
    return {**meta, 'results': [report_row(r) for r in rows],
            'reasons': [{'key': k, 'label': v} for k, v in AbuseReport.REASONS]}


# ---- themes, growth, revenue ----

def theme_rows(days=90):
    """Each registered theme: invitations on it now (all, live, paid), and new
    drafts and switches to and away over the last `days` days."""
    today = timezone.localdate()
    now_on = {r['theme']: r for r in real_invitations().values('theme').annotate(
        total=Count('id'), live=Count('id', filter=status_filter('live', today)),
        paid=Count('id', filter=~Q(tier='free')))}
    events = ActivityEvent.objects.filter(created_at__gte=timezone.now() - timedelta(days=days))
    created = dict(events.filter(kind='invitation_created').values_list('meta__theme').annotate(n=Count('id')))
    to = dict(events.filter(kind='theme_changed').values_list('meta__new').annotate(n=Count('id')))
    away = dict(events.filter(kind='theme_changed').values_list('meta__old').annotate(n=Count('id')))
    rows = []
    for tid, entry in themes.entries().items():
        r = now_on.get(tid, {})
        rows.append({'id': tid, 'name': entry['name'], 'status': entry['status'], 'preview': entry.get('previewImage'),
                     'total': r.get('total', 0), 'live': r.get('live', 0), 'paid': r.get('paid', 0),
                     'created': created.get(tid, 0), 'to': to.get(tid, 0), 'away': away.get(tid, 0)})
    rows.sort(key=lambda r: (-r['paid'], -r['total'], r['name']))
    return {'days': days, 'results': rows}


def growth(user, weeks=12):
    """The funnel per traffic source over the last `weeks` weeks, and coupon use."""
    today = timezone.localdate()
    since = today - timedelta(days=today.weekday(), weeks=weeks - 1)
    counts = {}
    for r in FunnelEvent.objects.filter(week__gte=since).values('utm_source', 'step').annotate(n=Count('id')):
        counts.setdefault(r['utm_source'] or '', {})[r['step']] = r['n']
    sources = [{'source': name, 'visit': c.get('visit', 0), 'register': c.get('register', 0),
                'onboarded': c.get('onboarded', 0)} for name, c in counts.items()]
    sources.sort(key=lambda r: (-r['register'], -r['visit']))
    revenue = can_see_revenue(user)
    coupons = []
    for c in Coupon.objects.annotate(used=Count('payments'), revenue=Sum('payments__amount')).order_by('-used', 'code'):
        row = {'code': c.code, 'discount_percent': c.discount_percent, 'valid': c.is_valid(),
               'description': c.description, 'used': c.used}
        if revenue:
            row['revenue'] = c.revenue or 0
        coupons.append(row)
    return {'weeks': weeks, 'since': iso(since), 'sources': sources, 'coupons': coupons}


def payment_row(p):
    return {'id': p.pk, 'at': iso(p.created_at), 'amount': p.amount, 'tier': p.tier, 'channel': p.channel,
            'channel_label': p.get_channel_display(), 'coupon': p.coupon.code if p.coupon else None,
            'note': p.note, 'recorded_by': p.recorded_by.username if p.recorded_by else None,
            'slug': p.invitation.slug if p.invitation else None, 'invitation_id': p.invitation_id}


def revenue():
    """Owner only (callers check): the last 12 months of recorded payments."""
    now = timezone.localtime()
    since = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=335)).replace(day=1)
    payments = Payment.objects.filter(created_at__gte=since)
    by_month = {r['m'].date(): r for r in payments.annotate(m=TruncMonth('created_at'))
                .values('m').annotate(total=Sum('amount'), n=Count('id'))}
    months, cursor = [], since.date()
    while cursor <= now.date():
        r = by_month.get(cursor, {})
        months.append({'month': iso(cursor), 'total': r.get('total') or 0, 'n': r.get('n', 0)})
        cursor = (cursor + timedelta(days=32)).replace(day=1)

    def split(field, labels):
        return [{'key': r[field], 'label': labels.get(r[field], r[field] or '(tanpa kupon)'), 'total': r['total'], 'n': r['n']}
                for r in payments.values(field).annotate(total=Sum('amount'), n=Count('id')).order_by('-total')]

    total = payments.aggregate(total=Sum('amount'), n=Count('id'))
    return {
        'since': iso(since.date()), 'months': months, 'total': total['total'] or 0, 'count': total['n'],
        'by_tier': split('tier', dict(Invitation.TIER_CHOICES)),
        'by_channel': split('channel', dict(Payment.CHANNELS)),
        'by_coupon': split('coupon__code', {}),
        'recent': [payment_row(p) for p in Payment.objects.select_related('invitation', 'coupon', 'recorded_by')[:30]],
    }
