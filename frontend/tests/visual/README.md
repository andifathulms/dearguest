# Visual regression — invitation themes

Screenshots the cover gate and opened hero of all 6 demo themes and compares
them against committed baselines, so a CSS change that breaks a theme fails CI
instead of shipping silently.

## Prerequisites
- Stack running: `docker compose up -d`
- Demos seeded: `docker compose exec backend python manage.py seed_demos`
- Browser installed once: `npx playwright install chromium`

## Run
```bash
cd frontend
npm run test:visual          # compare against baselines (fails on visual diff)
npm run test:visual:update   # re-generate baselines after an intentional change
```
On failure, Playwright writes a side-by-side diff under `test-results/`.

## Notes
- Baselines are **platform-specific** (suffixed `-darwin` here). CI should run
  in a matching environment — e.g. the official `mcr.microsoft.com/playwright`
  Linux image — and regenerate baselines there (commit the `-linux` set).
- Animations are frozen (`animations: 'disabled'`) and a small diff ratio is
  tolerated, so shimmer/petals/sun motion don't cause flaky diffs.
- Point at another origin with `PREVIEW_URL=… npm run test:visual`.
