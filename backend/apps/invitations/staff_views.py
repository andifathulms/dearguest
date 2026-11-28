"""/api/staff/: the backoffice's API (frontend src/backoffice/).

Staff sign in at /api/staff/login/ with password and authenticator code (the
same TOTP device as the Django admin, `manage.py enrol_totp`). That login
puts a `staff_otp` claim in the session's tokens; every other endpoint here
needs it, so a staff account signed in through the couples' login gets
nothing. Revenue and reset links are for the owner (`view_payment`, i.e. a
superuser); the Staf group sees everything else."""
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django_otp import match_token
from rest_framework import status
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.auth_api.cookies import set_session

from . import backoffice, staff_actions
from .models import AbuseReport, Coupon, Invitation, Payment, RSVP
from .throttling import client_ip

STAFF_CLAIM = 'staff_otp'
MAX_FAILURES = 5
LOCKOUT_SECONDS = 15 * 60


class IsVerifiedStaff(BasePermission):
    """An active staff account whose session came from the staff login."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active and user.is_staff):
            return False
        return bool(request.auth and request.auth.get(STAFF_CLAIM))


class IsOwner(IsVerifiedStaff):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and backoffice.can_see_revenue(request.user)


def me(user):
    return {'username': user.username, 'role': 'owner' if user.is_superuser else 'staff',
            'can_see_revenue': backoffice.can_see_revenue(user)}


class StaffLoginView(APIView):
    """POST {username, password, otp}. Five failures per address and username
    lock that pair out for 15 minutes, like the admin login."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = 'login'

    def post(self, request):
        username = str(request.data.get('username') or '').strip()[:150]
        key = f'staff_login_fail:{client_ip(request)}:{username.lower()}'
        if cache.get(key, 0) >= MAX_FAILURES:
            return Response({'detail': 'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.'},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)
        user = authenticate(request, username=username, password=str(request.data.get('password') or ''))
        ok = bool(user and user.is_active and user.is_staff)
        if ok and settings.ADMIN_REQUIRE_OTP:
            ok = match_token(user, str(request.data.get('otp') or '').strip()) is not None
        if not ok:
            cache.add(key, 0, LOCKOUT_SECONDS)
            cache.incr(key)
            return Response({'detail': 'Akun, kata sandi atau kode authenticator salah.'},
                            status=status.HTTP_400_BAD_REQUEST)
        cache.delete(key)
        refresh = RefreshToken.for_user(user)
        refresh[STAFF_CLAIM] = True   # copied into every access token made from it, refreshes included
        user.last_login = refresh.current_time
        user.save(update_fields=['last_login'])
        return set_session(request, Response(me(user)), refresh.access_token, refresh)


class StaffView(APIView):
    permission_classes = [IsVerifiedStaff]


class MeView(StaffView):
    def get(self, request):
        return Response(me(request.user))


class OverviewView(StaffView):
    def get(self, request):
        return Response(backoffice.overview(request.user))


class ActivityView(StaffView):
    def get(self, request):
        return Response(backoffice.activity_feed(request))


class WatchView(StaffView):
    def get(self, request):
        return Response({'days': backoffice.WATCH_DAYS, 'results': backoffice.wedding_watch(backoffice.WATCH_DAYS)})


class SystemView(StaffView):
    def get(self, request):
        return Response(backoffice.system())


class InvitationListView(StaffView):
    def get(self, request):
        return Response(backoffice.invitations(request))


class InvitationDetailView(StaffView):
    def get(self, request, pk):
        return Response(backoffice.invitation_detail(get_object_or_404(Invitation, pk=pk), request.user))


INVITATION_ACTIONS = {
    'issue_code': lambda inv, user: staff_actions.issue_code(inv, user),
    'activate': lambda inv, user: staff_actions.set_active(inv, user, True),
    'deactivate': lambda inv, user: staff_actions.set_active(inv, user, False),
    'extend': lambda inv, user: staff_actions.extend(inv, user),
    'watermark_off': lambda inv, user: staff_actions.set_watermark(inv, user, False),
    'watermark_on': lambda inv, user: staff_actions.set_watermark(inv, user, True),
}


class InvitationActionView(StaffView):
    """POST {action}: one of INVITATION_ACTIONS. Answers the updated detail."""

    def post(self, request, pk):
        inv = get_object_or_404(Invitation, pk=pk)
        action = INVITATION_ACTIONS.get(request.data.get('action'))
        if not action:
            return Response({'detail': 'Tindakan tidak dikenal.'}, status=status.HTTP_400_BAD_REQUEST)
        action(inv, request.user)
        return Response(backoffice.invitation_detail(inv, request.user))


class ActivationListView(StaffView):
    def get(self, request):
        return Response({'results': backoffice.activations(), 'coupons': list(
            Coupon.objects.filter(active=True).values('id', 'code', 'discount_percent'))})


class FulfillView(StaffView):
    """POST {tier, amount, channel, coupon?, note?}: the couple paid."""

    def post(self, request, pk):
        if not request.user.has_perm('invitations.add_payment'):
            return Response({'detail': 'Akun ini tidak boleh mencatat pembayaran.'}, status=status.HTTP_403_FORBIDDEN)
        inv = get_object_or_404(Invitation, pk=pk)
        data = request.data
        errors = {}
        tier = data.get('tier')
        if tier not in ('premium', 'bisnis'):
            errors['tier'] = 'Pilih Premium atau Bisnis.'
        try:
            amount = int(data.get('amount'))
            if amount < 0:
                raise ValueError
        except (TypeError, ValueError):
            errors['amount'] = 'Isi jumlah dalam rupiah, mis. 99000.'
            amount = None
        channel = data.get('channel') or 'transfer'
        if channel not in dict(Payment.CHANNELS):
            errors['channel'] = 'Cara bayar tidak dikenal.'
        coupon = None
        if data.get('coupon'):
            coupon = Coupon.objects.filter(pk=data.get('coupon')).first()
            if not coupon:
                errors['coupon'] = 'Kupon tidak ditemukan.'
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        staff_actions.fulfill(inv, request.user, tier, amount, channel, coupon, str(data.get('note') or '')[:200])
        inv.refresh_from_db()
        return Response({'activation_code': inv.activation_code, 'tier': inv.tier})


class CoupleListView(StaffView):
    def get(self, request):
        return Response(backoffice.couples(request, request.user))


class CoupleAllowTwoView(StaffView):
    def post(self, request, pk):
        staff_actions.allow_two(get_object_or_404(User, pk=pk, is_staff=False), request.user)
        return Response({'max_invitations': 2})


class CoupleResetLinkView(APIView):
    permission_classes = [IsOwner]

    def post(self, request, pk):
        return Response(staff_actions.reset_link(get_object_or_404(User, pk=pk, is_staff=False), request.user))


class WishListView(StaffView):
    def get(self, request):
        return Response(backoffice.wishes(request))


class WishStatusView(StaffView):
    """POST {wish_status: hidden | visible}."""

    def post(self, request, pk):
        wish_status = request.data.get('wish_status')
        if wish_status not in ('hidden', 'visible'):
            return Response({'detail': 'Status ucapan tidak dikenal.'}, status=status.HTTP_400_BAD_REQUEST)
        rsvp = get_object_or_404(RSVP.objects.exclude(wishes=''), pk=pk)
        staff_actions.set_wish(rsvp, request.user, wish_status)
        return Response({'wish_status': wish_status})


class ReportListView(StaffView):
    """GET the reports; POST {url, reason, reporter?, details?, slug?} to log one."""

    def get(self, request):
        return Response(backoffice.reports(request))

    def post(self, request):
        data = request.data
        url = str(data.get('url') or '').strip()[:300]
        reason = data.get('reason')
        if not url or reason not in dict(AbuseReport.REASONS):
            return Response({'detail': 'Isi tautan dan alasan laporan.'}, status=status.HTTP_400_BAD_REQUEST)
        slug = str(data.get('slug') or '').strip() or url.rstrip('/').split('/')[-1]
        report = AbuseReport.objects.create(
            url=url, reason=reason, reporter=str(data.get('reporter') or '')[:200],
            details=str(data.get('details') or ''), invitation=Invitation.objects.filter(slug=slug).first())
        staff_actions.record(request.user, report.invitation or report, 'Laporan dicatat')
        return Response(backoffice.report_row(report), status=status.HTTP_201_CREATED)


class ReportDecideView(StaffView):
    """POST {decision: takedown | no_action | restore, note?}."""

    def post(self, request, pk):
        decision = request.data.get('decision')
        if decision not in staff_actions.DECISIONS:
            return Response({'detail': 'Keputusan tidak dikenal.'}, status=status.HTTP_400_BAD_REQUEST)
        report = get_object_or_404(AbuseReport, pk=pk)
        staff_actions.decide_report(report, request.user, decision, str(request.data.get('note') or ''))
        report.refresh_from_db()
        return Response(backoffice.report_row(report))


class ThemesView(StaffView):
    def get(self, request):
        return Response(backoffice.theme_rows())


class GrowthView(StaffView):
    def get(self, request):
        return Response(backoffice.growth(request.user))


class RevenueView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        return Response(backoffice.revenue())
