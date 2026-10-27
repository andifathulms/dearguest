# DearGuest developer shortcuts. Requires the dev stack (`docker compose up -d`).

.PHONY: sync themes check test test-unit visual visual-update scripture

# Regenerate the backend/frontend copies of shared/ data (themes, copy, scripture).
sync:
	python3 scripts/sync_themes.py

themes: sync

# Rebuild shared/copy/scripture.json from Tanzil + SABDA (needs network). Then `make sync`.
scripture:
	python3 scripts/build_scripture.py

# Registry + copy consistency, theme-pack token contract.
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
