#!/bin/bash
# Days left on the TLS certificate nginx serves (run_scheduler, every 6 h). The
# deep health check alerts under 14 days, i.e. when certbot renewals stop.
set -euo pipefail
cd /app
end="$(echo | openssl s_client -connect "${CERT_CHECK_HOST:-nginx}:443" -servername "${DOMAIN}" 2>/dev/null \
        | openssl x509 -noout -enddate | cut -d= -f2)"
days=$(( ( $(date -d "$end" +%s) - $(date +%s) ) / 86400 ))
python manage.py ops_report cert_check ok --cert-days "$days"
