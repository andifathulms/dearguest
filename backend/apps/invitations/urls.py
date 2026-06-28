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
    MyInvitationView,
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

    # ===== Editor (authenticated, owner-scoped) =====
    path('my/invitation/', MyInvitationView.as_view()),
    path('my/slug-check/', SlugCheckView.as_view()),
    path('my/couple/', MyCoupleView.as_view()),
    path('my/events/', EventListCreate.as_view()),
    path('my/events/<int:pk>/', EventDetail.as_view()),
    path('my/stories/', StoryListCreate.as_view()),
    path('my/stories/<int:pk>/', StoryDetail.as_view()),
    path('my/photos/', PhotoListCreate.as_view()),
    path('my/photos/<int:pk>/', PhotoDetail.as_view()),
    path('my/bank-accounts/', BankAccountListCreate.as_view()),
    path('my/bank-accounts/<int:pk>/', BankAccountDetail.as_view()),
]
