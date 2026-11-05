# Smoke checks shared by deploy.sh and rollback.sh (sourced, not run).
# smoke <expected-release>: the health endpoint reports that release, and the
# landing page, a demo invitation, its API and its share page all answer.
smoke() {
  expected="$1"
  base="${SMOKE_BASE:-https://$(grep '^DOMAIN=' "${ENV_FILE:-.env}" | cut -d= -f2)}"
  demo="${SMOKE_DEMO:-demo-taman-sage}"
  [ "${DEPLOY_FORCE_SMOKE_FAIL:-0}" = 1 ] && { echo "  smoke: forced failure (drill)"; return 1; }
  i=0
  until curl -fsk -o /dev/null "$base/api/health/"; do
    i=$((i + 1)); [ $i -ge 30 ] && { echo "  smoke: health never came up"; return 1; }; sleep 2
  done
  health=$(curl -sk "$base/api/health/")
  echo "$health" | grep -q '"status": "ok"' || { echo "  smoke: health $health"; return 1; }
  echo "$health" | grep -q "\"release\": \"$expected\"" || { echo "  smoke: wrong release ($health)"; return 1; }
  for path in / "/$demo" "/api/invitations/$demo/" "/share/$demo/"; do
    code=$(curl -sk -o /dev/null -w '%{http_code}' "$base$path")
    [ "$code" = 200 ] || { echo "  smoke: $path answered $code"; return 1; }
  done
  echo "  smoke: ok ($expected)"
}
