import { defineConfig } from '@playwright/test'

// Visual-regression of the invitation themes. Requires the stack running
// (docker compose up) and demos seeded (manage.py seed_demos).
// Baselines: `npm run test:visual:update`. Check: `npm run test:visual`.
export default defineConfig({
  testDir: './tests/visual',
  snapshotDir: './tests/visual/__screenshots__',
  fullyParallel: true,
  // The suite now includes WebGL themes, and at default parallelism a loaded
  // machine starves them enough to fail — including tests that have nothing to
  // do with 3D. Two workers keeps it honest.
  workers: 2,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://localhost:5173',
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 1,
  },
  expect: {
    // Allow tiny anti-aliasing/photo-decode differences; freeze animations.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled', scale: 'css' },
  },
})
