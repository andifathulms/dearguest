"""The backoffice: operator pages inside the Django admin (config/admin_site.py
mounts them), so they share its path, TOTP and lockout. Server-rendered, no
script, as the CSP wants. Any staff user sees them; revenue needs the
`invitations.view_payment` permission (owner), which the Staf group lacks.

    <admin>/                 Ringkasan: counts, funnel, wedding-day watch, feed
    <admin>/ops/aktivitas/   the activity feed (ActivityEvent), filterable
    <admin>/ops/hari-h/      weddings in the next 14 days and how ready they are
    <admin>/ops/tema/        which theme packs are chosen, go live and are paid for
    <admin>/ops/sistem/      the deep health check, job runs, retention queue

Theme demo invitations (seed_demos) are left out of every count."""
import shutil
from datetime import timedelta

from django.conf import settings
from django.contrib import admin
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.paginator import Paginator
from django.db.models import Count, Q, Sum
from django.template.response import TemplateResponse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.timesince import timesince

from . import activity, health, ops, retention, themes
from .models import AbuseReport, ActivityEvent, FunnelEvent, Guest, Invitation, Payment, RSVP

WATCH_DAYS_OVERVIEW = 7
WATCH_DAYS = 14
FEED_PAGE = 50

# Pill colour per kind: what needs you, what went well, the rest.
KIND_TONE = {
    'activation_requested': 'warn', 'activated': 'ok', 'register': 'brand', 'invitation_created': 'brand',
    'theme_changed': 'brand', 'account_deleted': 'crit', 'staff_action': 'info',
}


def rupiah(n):
    return 'Rp ' + f'{n or 0:,}'.replace(',', '.')


def can_see_revenue(user):
    return user.has_perm('invitations.view_payment')


def _demo_slugs():
    return {t['demoSlug'] for t in themes.entries().values() if t.get('demoSlug')}


def real_invitations():
    return Invitation.objects.exclude(slug__in=_demo_slugs())


# An invitation's place in its life: (key, label, pill tone). The first match wins.
STATUSES = [
    ('purged', 'Data dihapus', 'info'),
    ('expired', 'Berakhir', 'info'),
    ('live', 'Aktif', 'ok'),
    ('requested', 'Minta aktivasi', 'warn'),
    ('draft', 'Draf', 'brand'),
]


def status_filter(key, today=None):
    """The Q for one of STATUSES, for the admin list filter."""
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
        key = 'purged'
    elif inv.expires_at and inv.expires_at < today:
        key = 'expired'
    elif inv.is_active:
        key = 'live'
    elif inv.activation_requested:
        key = 'requested'
    else:
        key = 'draft'
    return next(s for s in STATUSES if s[0] == key)


def pill(tone, text):
    return format_html('<span class="ops-pill {}">{}</span>', tone, text)


def _theme_name(theme_id):
    return (themes.get(theme_id) or {}).get('name', theme_id)


def describe(ev):
    """One line for the feed, in Indonesian. Only ids and meta, never personal data."""
    m = ev.meta or {}
    if ev.kind == 'register':
        return 'Pasangan baru daftar' + (f' via {m["source"]}' if m.get('source') else '')
    if ev.kind == 'invitation_created':
        return f'Undangan baru · {_theme_name(m.get("theme", ""))}'
    if ev.kind == 'theme_changed':
        return f'Ganti tema {_theme_name(m.get("old", ""))} → {_theme_name(m.get("new", ""))}'
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
    return [{'ev': ev, 'text': describe(ev), 'tone': KIND_TONE.get(ev.kind, 'info'),
             'slug': ev.invitation.slug if ev.invitation else ''} for ev in events]


def _delta(now_n, before_n):
    if not before_n:
        return f'+{now_n}' if now_n else '0'
    pct = round((now_n - before_n) / before_n * 100)
    return f'{pct:+d}%'


def wedding_watch(days, today=None):
    """Weddings from today to `days` ahead, with what's ready and what isn't.
    A few rows a week, so plain per-row counts."""
    today = today or timezone.localdate()
    rows = []
    qs = (real_invitations().select_related('couple')
          .filter(wedding_date__gte=today, wedding_date__lte=today + timedelta(days=days))
          .annotate(n_events=Count('events', distinct=True)).order_by('wedding_date'))
    for inv in qs:
        guests = Guest.objects.filter(invitation=inv)
        answers = RSVP.objects.filter(invitation=inv)
        row = {
            'inv': inv, 'names': _names(inv), 'days_left': (inv.wedding_date - today).days,
            'guests': guests.count(), 'sent': guests.filter(sent_at__isnull=False).count(),
            'rsvps': answers.count(),
            'pax': answers.filter(attending=True).aggregate(n=Sum('pax'))['n'] or 0,
            'checked_in': guests.filter(checked_in=True).count() if inv.wedding_date == today else None,
        }
        flags = []
        if not inv.is_active:
            flags.append(('crit', 'belum aktif'))
        if not inv.n_events:
            flags.append(('crit', 'tanpa acara'))
        if row['guests'] and not row['sent']:
            flags.append(('warn', 'belum dikirim ke tamu'))
        if row['guests'] >= 100 and not inv.usher_enabled:
            flags.append(('warn', 'penerima tamu belum aktif'))
        row['flags'] = flags
        row['tone'] = flags[0][0] if flags else 'ok'
        rows.append(row)
    return rows


def _names(inv):
    couple = getattr(inv, 'couple', None)
    if couple and (couple.bride_name or couple.groom_name):
        return f'{couple.bride_name} & {couple.groom_name}'
    return ''


def overview(request):
    now = timezone.now()
    today = timezone.localdate()
    week_ago, two_weeks_ago = now - timedelta(days=7), now - timedelta(days=14)
    invs = real_invitations()

    pending = invs.filter(activation_requested=True, is_active=False)
    oldest = pending.order_by('activation_requested_at').values_list('activation_requested_at', flat=True).first()
    couples = User.objects.filter(is_staff=False)
    signups = couples.filter(date_joined__gte=week_ago).count()
    signups_before = couples.filter(date_joined__gte=two_weeks_ago, date_joined__lt=week_ago).count()
    live = invs.filter(is_active=True, expires_at__gte=today)
    tiers = dict(live.values_list('tier').annotate(n=Count('id')))
    rsvps = RSVP.objects.filter(invitation__in=invs)
    rsvp_week = rsvps.filter(submitted_at__gte=week_ago).count()
    rsvp_before = rsvps.filter(submitted_at__gte=two_weeks_ago, submitted_at__lt=week_ago).count()
    held = rsvps.filter(wish_status='pending')
    reports = AbuseReport.objects.filter(status='new').count()

    kpis = [
        {'label': 'Menunggu aktivasi', 'value': pending.count(), 'action': pending.exists(),
         'note': f'tertua {timesince(oldest)}' if oldest else 'tidak ada',
         'url': 'admin:invitations_activationrequest_changelist'},
        {'label': 'Daftar baru · 7 hari', 'value': signups, 'note': f'{_delta(signups, signups_before)} vs minggu lalu'},
        {'label': 'Undangan aktif', 'value': live.count(),
         'note': f'{tiers.get("premium", 0)} Premium · {tiers.get("bisnis", 0)} Bisnis · {tiers.get("free", 0)} Gratis'},
        {'label': 'Undangan baru · 7 hari', 'value': invs.filter(created_at__gte=week_ago).count(),
         'note': f'{invs.filter(activated_at__gte=week_ago).count()} jadi aktif'},
        {'label': 'RSVP · 7 hari', 'value': rsvp_week, 'note': f'{_delta(rsvp_week, rsvp_before)} vs minggu lalu'},
        {'label': 'Ucapan ditahan', 'value': held.count(),
         'note': f'menunggu pasangan · {held.values("invitation").distinct().count()} undangan',
         'url': 'admin:invitations_rsvp_changelist', 'query': '?wish_status__exact=pending'},
        {'label': 'Laporan baru', 'value': reports, 'action': bool(reports),
         'note': 'takedown / penyalahgunaan', 'url': 'admin:invitations_abusereport_changelist',
         'query': '?status__exact=new'},
    ]
    if can_see_revenue(request.user):
        month = now.astimezone(timezone.get_current_timezone()).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        paid = Payment.objects.filter(created_at__gte=month).aggregate(total=Sum('amount'), n=Count('id'))
        kpis.append({'label': 'Pendapatan · bulan ini', 'value': rupiah(paid['total']),
                     'note': f'{paid["n"]} pembayaran, dicatat manual', 'url': 'admin:invitations_payment_changelist'})

    monday = today - timedelta(days=today.weekday())
    counts = dict(FunnelEvent.objects.filter(week=monday).values_list('step').annotate(n=Count('id')))
    top = max(counts.get('visit', 0), 1)
    funnel = [{'label': label, 'n': counts.get(key, 0), 'pct': round(counts.get(key, 0) / top * 100),
               'pending': key in ('checkout', 'paid')} for key, label in FunnelEvent.STEPS]

    events = ActivityEvent.objects.select_related('invitation', 'user')[:12]
    return {
        'kpis': kpis, 'funnel': funnel, 'funnel_week': monday,
        'watch': wedding_watch(WATCH_DAYS_OVERVIEW, today), 'watch_days': WATCH_DAYS_OVERVIEW,
        'feed': feed_rows(events), 'system': system_pills(),
    }


def _checks(with_storage=False):
    checks = {'Database': health._check(health._db), 'Cache (Redis)': health._check(health._cache)}
    if with_storage:
        checks['Penyimpanan'] = health._check(health._storage)
    checks.update({'Disk': health._check(health._disk, True), 'Sertifikat': health._check(health._cert, True)})
    return checks


def _jobs(now):
    rows = []
    for job, limit in health.JOBS.items():
        last = ops.last_run(job)
        rows.append({'job': job, 'last': last, 'ago': timesince(last, now) if last else None,
                     'ok': bool(last) and now - last <= limit})
    return rows


def system_pills():
    """The overview's one-line health: each check and job as a pill."""
    now = timezone.now()
    checks = _checks()
    try:
        usage = shutil.disk_usage(settings.MEDIA_ROOT)
        disk = f'Disk {round(usage.used / usage.total * 100)}%'
    except OSError:   # the check above already reports it as failed
        disk = 'Disk'
    cert_days = cache.get('ops:cert_days')
    labels = {'Disk': disk,
              'Sertifikat': f'Sertifikat {cert_days} hari' if cert_days is not None else 'Sertifikat belum dicek'}
    pills = [('ok' if c['ok'] else 'crit', labels.get(name, name)) for name, c in checks.items()]
    for j in _jobs(now):
        pills.append(('ok' if j['ok'] else 'warn', f'{j["job"]} {j["ago"] + " lalu" if j["ago"] else "belum jalan"}'))
    pills.append(('info', f'rilis {settings.RELEASE}'))
    return pills


def _page(request, template, title, context):
    return TemplateResponse(request, template, {
        **admin.site.each_context(request), 'title': title, 'ops_revenue': can_see_revenue(request.user), **context,
    })


def activity_view(request):
    kind = request.GET.get('kind', '')
    slug = request.GET.get('slug', '').strip()
    qs = ActivityEvent.objects.select_related('invitation', 'user')
    if kind:
        qs = qs.filter(kind=kind)
    if slug:
        qs = qs.filter(invitation__slug__icontains=slug)
    page = Paginator(qs, FEED_PAGE).get_page(request.GET.get('p'))
    query = '&'.join(f'{k}={v}' for k, v in (('kind', kind), ('slug', slug)) if v)
    return _page(request, 'admin/vowvella/activity.html', 'Aktivitas', {
        'rows': feed_rows(page.object_list), 'page': page, 'kinds': ActivityEvent.KINDS,
        'kind': kind, 'slug': slug, 'query': query, 'keep_days': activity.KEEP_DAYS,
    })


def watch_view(request):
    return _page(request, 'admin/vowvella/watch.html', 'Hari H', {
        'watch': wedding_watch(WATCH_DAYS), 'watch_days': WATCH_DAYS,
    })


def system_view(request):
    now = timezone.now()
    today = timezone.localdate()
    return _page(request, 'admin/vowvella/system.html', 'Sistem', {
        'checks': _checks(with_storage=True), 'jobs': _jobs(now), 'release': settings.RELEASE,
        'notices_due': retention.due_for_notice(today).count(),
        'purges_due': len(retention.due_for_purge(today, now)),
        'expiring': real_invitations().filter(is_active=True, expires_at__gte=today,
                                              expires_at__lte=today + timedelta(days=7)).count(),
        'activity_rows': ActivityEvent.objects.count(),
    })


def theme_rows(since):
    """One row per registered theme: invitations on it now (all, live, paid),
    and what the activity feed saw since `since` (new drafts, switches)."""
    today = timezone.localdate()
    invs = real_invitations()
    now_on = {r['theme']: r for r in invs.values('theme').annotate(
        total=Count('id'), live=Count('id', filter=status_filter('live', today)),
        paid=Count('id', filter=~Q(tier='free')))}
    events = ActivityEvent.objects.filter(created_at__gte=since)
    created = dict(events.filter(kind='invitation_created').values_list('meta__theme').annotate(n=Count('id')))
    to = dict(events.filter(kind='theme_changed').values_list('meta__new').annotate(n=Count('id')))
    away = dict(events.filter(kind='theme_changed').values_list('meta__old').annotate(n=Count('id')))
    rows = []
    for tid, entry in themes.entries().items():
        r = now_on.get(tid, {})
        rows.append({'id': tid, 'name': entry['name'], 'status': entry['status'], 'tier': entry.get('tier', ''),
                     'total': r.get('total', 0), 'live': r.get('live', 0), 'paid': r.get('paid', 0),
                     'created': created.get(tid, 0), 'to': to.get(tid, 0), 'away': away.get(tid, 0)})
    rows.sort(key=lambda r: (-r['paid'], -r['total'], r['name']))
    return rows


def themes_view(request):
    days = 90
    return _page(request, 'admin/vowvella/themes.html', 'Tema', {
        'rows': theme_rows(timezone.now() - timedelta(days=days)), 'days': days,
    })
