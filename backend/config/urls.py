from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static

from apps.invitations.share_views import crawler_view, og_image_view, share_view

# A slug that isn't one of the backend's own prefixes (so /admin still gets its
# trailing-slash redirect).
INVITATION = r'(?!(?:admin|api|media|share|og|static)(?:/|$))(?P<slug>[-\w]+)'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.invitations.urls')),
    path('api/auth/', include('apps.auth_api.urls')),
    path('share/<slug:slug>/', share_view),
    re_path(r'^og/(?P<slug>[-\w]+)/(?P<digest>[0-9a-f]{16})\.jpg$', og_image_view),
    re_path(r'^og/(?P<slug>[-\w]+)/(?P<code>[A-Za-z0-9]{4,12})/(?P<digest>[0-9a-f]{16})\.jpg$', og_image_view),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + [
    # Invitation links as crawlers see them (nginx / Vite route only crawler
    # user-agents here). Last, so nothing above is shadowed.
    re_path(rf'^{INVITATION}/?$', crawler_view),
    re_path(rf'^{INVITATION}/(?P<code>[A-Za-z0-9]{{4,12}})/?$', crawler_view),
]
