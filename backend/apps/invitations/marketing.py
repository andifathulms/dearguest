"""Landing-page content the admin edits: pricing cards and couples' quotes.

GET /api/site/marketing/ is public and read-only. The landing page falls back
to its built-in copy of the plans if this call fails, so the page never shows
an empty pricing section."""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import themes
from .models import Plan, Testimonial


def plan_data(plan):
    return {
        'slug': plan.slug,
        'name': plan.name,
        'price': plan.price,
        # A "was" price only when it is really higher than today's price.
        'compare_at_price': plan.compare_at_price if (plan.compare_at_price or 0) > plan.price else None,
        'badge': plan.badge,
        'audience': plan.audience,
        'features': plan.feature_list(),
        'cta_label': plan.cta_label,
        'is_featured': plan.is_featured,
    }


def testimonial_data(t):
    entry = themes.get(t.theme) if t.theme else None
    return {
        'id': t.pk,
        'names': t.names,
        'city': t.city,
        'quote': t.quote,
        'theme': t.theme if entry else '',
        'theme_name': entry['name'] if entry else '',
    }


class MarketingView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({
            'plans': [plan_data(p) for p in Plan.objects.filter(is_active=True)],
            'testimonials': [testimonial_data(t) for t in Testimonial.objects.filter(is_published=True)],
        })
