# DearGuest developer shortcuts. Requires the dev stack (`docker compose up -d`).

.PHONY: themes check test visual visual-update

# Regenerate the backend/frontend copies of shared/themes.json.
themes:
	python3 scripts/sync_themes.py

# Registry consistency + theme-pack token contract.
check:
	python3 scripts/check_themes.py

# Backend test suite (runs inside the backend container).
test: check
	docker compose exec -T backend python manage.py test --noinput

# Theme-pack visual suite (Linux, Chromium + WebKit) in Docker; needs the dev stack.
visual:
	cd frontend && sh scripts/visual-docker.sh

visual-update:
	cd frontend && sh scripts/visual-docker.sh --update-snapshots
