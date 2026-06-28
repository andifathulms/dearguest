from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MeView, ThrottledLoginView

urlpatterns = [
    path('login/', ThrottledLoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('register/', RegisterView.as_view()),
    path('me/', MeView.as_view()),
]
