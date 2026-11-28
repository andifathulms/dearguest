"""The backoffice API, mounted at /api/staff/ (staff_views.py)."""
from django.urls import path

from . import staff_views as v

urlpatterns = [
    path('login/', v.StaffLoginView.as_view()),
    path('me/', v.MeView.as_view()),
    path('overview/', v.OverviewView.as_view()),
    path('activity/', v.ActivityView.as_view()),
    path('watch/', v.WatchView.as_view()),
    path('system/', v.SystemView.as_view()),
    path('invitations/', v.InvitationListView.as_view()),
    path('invitations/<int:pk>/', v.InvitationDetailView.as_view()),
    path('invitations/<int:pk>/action/', v.InvitationActionView.as_view()),
    path('activations/', v.ActivationListView.as_view()),
    path('activations/<int:pk>/fulfill/', v.FulfillView.as_view()),
    path('couples/', v.CoupleListView.as_view()),
    path('couples/<int:pk>/allow-two/', v.CoupleAllowTwoView.as_view()),
    path('couples/<int:pk>/reset-link/', v.CoupleResetLinkView.as_view()),
    path('wishes/', v.WishListView.as_view()),
    path('wishes/<int:pk>/', v.WishStatusView.as_view()),
    path('reports/', v.ReportListView.as_view()),
    path('reports/<int:pk>/decide/', v.ReportDecideView.as_view()),
    path('themes/', v.ThemesView.as_view()),
    path('growth/', v.GrowthView.as_view()),
    path('revenue/', v.RevenueView.as_view()),
    path('vouchers/', v.VoucherListView.as_view()),
    path('vouchers/new-code/', v.VoucherCodeView.as_view()),
    path('vouchers/<int:pk>/', v.VoucherDetailView.as_view()),
]
