"""Marketing funnel: visit -> register -> onboarded (-> checkout -> paid, from
Phase 3). Anonymous counts per week and UTM source; see FunnelEvent."""
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .crawlers import is_crawler
from .models import FunnelEvent

UTM_FIELDS = ('utm_source', 'utm_medium', 'utm_campaign')


def clean_utm(data):
    """{'utm_source': ...} from a request body's `utm` object; junk dropped."""
    utm = data.get('utm') if hasattr(data, 'get') else None
    if not isinstance(utm, dict):
        return {}
    return {k: str(utm.get(k) or '').strip()[:100] for k in UTM_FIELDS if utm.get(k)}


def record(step, utm=None):
    today = timezone.localdate()
    FunnelEvent.objects.create(step=step, week=today - timedelta(days=today.weekday()), **(utm or {}))


class FunnelVisitView(APIView):
    """POST {utm: {...}}: one landing visit. The page sends it at most once per
    browser session; bots are dropped."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = 'funnel'

    def post(self, request):
        if not is_crawler(request.META.get('HTTP_USER_AGENT')):
            record('visit', clean_utm(request.data))
        return Response(status=status.HTTP_204_NO_CONTENT)
