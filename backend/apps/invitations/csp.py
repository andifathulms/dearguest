"""Content-Security-Policy violation reports (nginx's CSP `report-uri`).

Only the violated directive and the blocked origin are logged: a report's
document URL can carry a guest link or ?to= name, so it is never kept."""
import json
import logging
from urllib.parse import urlsplit

from rest_framework import status
from rest_framework.parsers import BaseParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

log = logging.getLogger('dearguest.csp')
MAX_BODY = 16 * 1024


class CSPReportParser(BaseParser):
    media_type = 'application/csp-report'

    def parse(self, stream, media_type=None, parser_context=None):
        return json.loads(stream.read(MAX_BODY) or b'{}')


def _origin(uri):
    if not uri or ':' not in uri:
        return uri or ''   # 'inline', 'eval', 'data', ...
    parts = urlsplit(uri)
    return f'{parts.scheme}://{parts.netloc}' if parts.netloc else parts.scheme


class CSPReportView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [CSPReportParser]
    throttle_scope = 'csp'

    def post(self, request):
        report = request.data.get('csp-report', {}) if isinstance(request.data, dict) else {}
        if isinstance(report, dict) and report:
            log.warning('csp violation', extra={'csp': {
                'directive': str(report.get('effective-directive') or report.get('violated-directive') or '')[:80],
                'blocked': _origin(str(report.get('blocked-uri') or ''))[:200],
                'disposition': str(report.get('disposition') or '')[:20],
            }})
        return Response(status=status.HTTP_204_NO_CONTENT)
