from django.urls import path
from .views import (
    CookieRefreshView, LogoutView, RegisterView, MeView, ThrottledLoginView,
    PasswordResetView, PasswordResetConfirmView,
)

urlpatterns = [
    path('login/', ThrottledLoginView.as_view()),
    path('refresh/', CookieRefreshView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('register/', RegisterView.as_view()),
    path('me/', MeView.as_view()),
    path('password-reset/', PasswordResetView.as_view()),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view()),
]
