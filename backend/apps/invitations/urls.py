from django.urls import path
from .views import (
    InvitationDetailView,
    RSVPCreateView,
    RSVPListView,
    WishesListView,
    GuestListCreateView,
    GuestDetailView,
)

urlpatterns = [
    path('invitations/<slug:slug>/', InvitationDetailView.as_view()),
    path('invitations/<slug:slug>/rsvp/', RSVPCreateView.as_view()),
    path('invitations/<slug:slug>/rsvps/', RSVPListView.as_view()),
    path('invitations/<slug:slug>/wishes/', WishesListView.as_view()),
    path('invitations/<slug:slug>/guests/', GuestListCreateView.as_view()),
    path('invitations/<slug:slug>/guests/<int:pk>/', GuestDetailView.as_view()),
]
