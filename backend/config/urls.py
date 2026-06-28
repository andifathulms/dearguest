from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.invitations.share_views import share_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.invitations.urls')),
    path('api/auth/', include('apps.auth_api.urls')),
    path('share/<slug:slug>/', share_view),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
