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
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_otp import match_token
from rest_framework import status
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.auth_api.cookies import set_session

from . import backoffice, blog, staff_actions, themes, vouchers
from .models import AbuseReport, Article, ArticleImage, Coupon, Invitation, Payment, RSVP
from .uploads import validate_image_upload
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
            'can_see_revenue': backoffice.can_see_revenue(user),
            'can_manage_vouchers': user.has_perm('invitations.add_coupon')}


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
        usable = [c for c in Coupon.objects.filter(active=True).order_by('code') if vouchers.state(c) == 'active']
        return Response({'results': backoffice.activations(),
                         'coupons': [{'id': c.pk, **vouchers.public_data(c)} for c in usable]})


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
                errors['coupon'] = 'Voucher tidak ditemukan.'
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            staff_actions.fulfill(inv, request.user, tier, amount, channel, coupon, str(data.get('note') or '')[:200])
        except vouchers.VoucherError as exc:
            return Response({'coupon': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
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


class VoucherListView(StaffView):
    """GET every voucher (?state=, ?q=); POST to make one (owner: add_coupon).
    A blank code gets a generated one."""

    def get(self, request):
        return Response(backoffice.voucher_list(request, request.user))

    def post(self, request):
        if not request.user.has_perm('invitations.add_coupon'):
            return Response({'detail': 'Akun ini tidak boleh membuat voucher.'}, status=status.HTTP_403_FORBIDDEN)
        fields, errors = vouchers.clean(request.data)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        coupon = staff_actions.save_voucher(request.user, fields)
        return Response(backoffice.voucher_detail(coupon, request.user), status=status.HTTP_201_CREATED)


class VoucherDetailView(StaffView):
    """GET a voucher with its uses; PATCH to change it (change_coupon);
    DELETE only a voucher nobody used (delete_coupon)."""

    def get(self, request, pk):
        return Response(backoffice.voucher_detail(get_object_or_404(Coupon, pk=pk), request.user))

    def patch(self, request, pk):
        if not request.user.has_perm('invitations.change_coupon'):
            return Response({'detail': 'Akun ini tidak boleh mengubah voucher.'}, status=status.HTTP_403_FORBIDDEN)
        coupon = get_object_or_404(Coupon, pk=pk)
        fields, errors = vouchers.clean(request.data, coupon)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        staff_actions.save_voucher(request.user, fields, coupon)
        return Response(backoffice.voucher_detail(coupon, request.user))

    def delete(self, request, pk):
        if not request.user.has_perm('invitations.delete_coupon'):
            return Response({'detail': 'Akun ini tidak boleh menghapus voucher.'}, status=status.HTTP_403_FORBIDDEN)
        coupon = get_object_or_404(Coupon, pk=pk)
        if coupon.redemptions.exists():
            return Response({'detail': 'Voucher ini sudah pernah dipakai, jadi tidak bisa dihapus. Nonaktifkan saja.'},
                            status=status.HTTP_409_CONFLICT)
        staff_actions.delete_voucher(request.user, coupon)
        return Response(status=status.HTTP_204_NO_CONTENT)


class VoucherCodeView(StaffView):
    """GET a fresh unused code, for the form's "buat kode" button."""

    def get(self, request):
        return Response({'code': vouchers.generate_code()})


# ---- blog articles ----

def _image_or_error(request, field='image'):
    """The uploaded image, checked like every other upload, or a 400."""
    f = request.FILES.get(field)
    if not f:
        return None, Response({field: 'Pilih gambar dulu.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_image_upload(f)
    except DjangoValidationError as exc:
        return None, Response({field: ' '.join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
    return f, None


class ArticleListView(StaffView):
    """GET articles (?state=draft|scheduled|live, ?q=); POST to start one."""

    def get(self, request):
        now = timezone.now()
        rows = [blog.staff_row(a, request) for a in Article.objects.order_by('-updated_at')]
        counts = {k: sum(r['state'] == k for r in rows) for k in ('draft', 'scheduled', 'live')}
        wanted, q = request.GET.get('state', ''), request.GET.get('q', '').strip().lower()
        if wanted in counts:
            rows = [r for r in rows if r['state'] == wanted]
        if q:
            rows = [r for r in rows if q in r['title'].lower() or q in r['slug']]
        return Response({'results': rows, 'state_counts': counts, 'now': now.isoformat(),
                         'categories': [{'key': k, 'label': v} for k, v in Article.CATEGORIES],
                         'themes': [{'id': t, 'name': name} for t, name in themes.choices(include_hidden=False)],
                         'can_delete': request.user.has_perm('invitations.delete_article')})

    def post(self, request):
        if not request.user.has_perm('invitations.add_article'):
            return Response({'detail': 'Akun ini tidak boleh menulis artikel.'}, status=status.HTTP_403_FORBIDDEN)
        fields, errors = blog.clean(request.data)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        article = Article.objects.create(created_by=request.user, **fields)
        staff_actions.record(request.user, article, f'Artikel dibuat: {article.title}')
        return Response(blog.staff_detail(article, request), status=status.HTTP_201_CREATED)


class ArticleDetailView(StaffView):
    """GET one article to edit; PATCH to save (publishing included); DELETE
    (owner: delete_article)."""

    def get(self, request, pk):
        return Response(blog.staff_detail(get_object_or_404(Article, pk=pk), request))

    def patch(self, request, pk):
        if not request.user.has_perm('invitations.change_article'):
            return Response({'detail': 'Akun ini tidak boleh mengubah artikel.'}, status=status.HTTP_403_FORBIDDEN)
        article = get_object_or_404(Article, pk=pk)
        was = blog.state(article)
        fields, errors = blog.clean(request.data, article)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        for name, value in fields.items():
            setattr(article, name, value)
        article.save()
        now = blog.state(article)
        if now != was:
            labels = {'draft': 'jadi draf', 'scheduled': 'dijadwalkan', 'live': 'diterbitkan'}
            staff_actions.record(request.user, article, f'Artikel {labels[now]}: {article.title}')
        return Response(blog.staff_detail(article, request))

    def delete(self, request, pk):
        if not request.user.has_perm('invitations.delete_article'):
            return Response({'detail': 'Hanya pemilik yang bisa menghapus artikel.'}, status=status.HTTP_403_FORBIDDEN)
        article = get_object_or_404(Article, pk=pk)
        staff_actions.record(request.user, article, f'Artikel dihapus: {article.title}')
        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArticleCoverView(StaffView):
    """POST image=<file> to set the cover; DELETE to remove it."""

    def post(self, request, pk):
        if not request.user.has_perm('invitations.change_article'):
            return Response({'detail': 'Akun ini tidak boleh mengubah artikel.'}, status=status.HTTP_403_FORBIDDEN)
        article = get_object_or_404(Article, pk=pk)
        f, error = _image_or_error(request)
        if error:
            return error
        if article.cover:
            article.cover.delete(save=False)
        article.cover = f
        article.save(update_fields=['cover', 'updated_at'])
        return Response(blog.staff_detail(article, request))

    def delete(self, request, pk):
        if not request.user.has_perm('invitations.change_article'):
            return Response({'detail': 'Akun ini tidak boleh mengubah artikel.'}, status=status.HTTP_403_FORBIDDEN)
        article = get_object_or_404(Article, pk=pk)
        if article.cover:
            article.cover.delete(save=False)
            article.cover = None
            article.save(update_fields=['cover', 'updated_at'])
        return Response(blog.staff_detail(article, request))


class ArticleImageView(StaffView):
    """POST image=<file> (article=<id> optional): an image for an article's
    body. Answers its URL and the line to paste into the text."""

    def post(self, request):
        if not request.user.has_perm('invitations.add_articleimage'):
            return Response({'detail': 'Akun ini tidak boleh mengunggah gambar.'}, status=status.HTTP_403_FORBIDDEN)
        f, error = _image_or_error(request)
        if error:
            return error
        article = Article.objects.filter(pk=request.data.get('article') or 0).first()
        image = ArticleImage.objects.create(article=article, image=f, created_by=request.user)
        url = request.build_absolute_uri(image.image.url) if not image.image.url.startswith('http') else image.image.url
        alt = str(request.data.get('alt') or '').replace(']', '').strip()
        return Response({'url': url, 'markdown': f'![{alt}]({url})'}, status=status.HTTP_201_CREATED)


class ArticlePreviewView(StaffView):
    """POST {body}: the HTML the article will show, with its sections."""

    def post(self, request):
        body = str(request.data.get('body') or '')
        return Response({'html': blog.render(body), 'toc': blog.headings(body),
                         'reading_minutes': blog.reading_minutes(body), 'words': len(blog.plain_text(body).split())})
