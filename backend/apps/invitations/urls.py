from django.urls import path
from .views import (
    InvitationDetailView,
    RSVPCreateView,
    RSVPListView,
    WishesListView,
    GuestListCreateView,
    GuestDetailView,
)
from .editor_views import (
    MyInvitationsView,
    MyInvitationDetailView,
    RequestActivationView,
    ActivateView,
    SlugCheckView,
    MyCoupleView,
    EventListCreate,
    EventDetail,
    StoryListCreate,
    StoryDetail,
    PhotoListCreate,
    PhotoDetail,
    BankAccountListCreate,
    BankAccountDetail,
)

urlpatterns = [
    path('invitations/<slug:slug>/', InvitationDetailView.as_view()),
    path('invitations/<slug:slug>/rsvp/', RSVPCreateView.as_view()),
    path('invitations/<slug:slug>/rsvps/', RSVPListView.as_view()),
    path('invitations/<slug:slug>/wishes/', WishesListView.as_view()),
    path('invitations/<slug:slug>/guests/', GuestListCreateView.as_view()),
    path('invitations/<slug:slug>/guests/<int:pk>/', GuestDetailView.as_view()),

    # ===== Editor (authenticated, owner-scoped, multi-invitation) =====
    path('my/slug-check/', SlugCheckView.as_view()),
    path('my/invitations/', MyInvitationsView.as_view()),
    path('my/invitations/<slug:slug>/', MyInvitationDetailView.as_view()),
    path('my/invitations/<slug:slug>/request-activation/', RequestActivationView.as_view()),
    path('my/invitations/<slug:slug>/activate/', ActivateView.as_view()),
    path('my/invitations/<slug:slug>/couple/', MyCoupleView.as_view()),
    path('my/invitations/<slug:slug>/events/', EventListCreate.as_view()),
    path('my/invitations/<slug:slug>/events/<int:pk>/', EventDetail.as_view()),
    path('my/invitations/<slug:slug>/stories/', StoryListCreate.as_view()),
    path('my/invitations/<slug:slug>/stories/<int:pk>/', StoryDetail.as_view()),
    path('my/invitations/<slug:slug>/photos/', PhotoListCreate.as_view()),
    path('my/invitations/<slug:slug>/photos/<int:pk>/', PhotoDetail.as_view()),
    path('my/invitations/<slug:slug>/bank-accounts/', BankAccountListCreate.as_view()),
    path('my/invitations/<slug:slug>/bank-accounts/<int:pk>/', BankAccountDetail.as_view()),
]
