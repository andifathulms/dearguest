import { defineConfig, devices } from '@playwright/test'

// Theme-pack visual suite: Linux baselines, Chromium + WebKit, three sizes.
// Runs inside mcr.microsoft.com/playwright (npm run test:visual:docker) against
// the dev compose `frontend` service; the API is stubbed, so no DB is needed.
// The older macOS suites keep using playwright.config.js.
const sizes = [
  ['360', { width: 360, height: 800 }],
  ['390', { width: 390, height: 844 }],
  ['1440', { width: 1440, height: 900 }],
]
const browsers = [
  ['chromium', devices['Desktop Chrome']],
  ['webkit', devices['Desktop Safari']],
]

export default defineConfig({
  testDir: './tests/visual/packs',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  timeout: 90_000,
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://frontend:5173',
    deviceScaleFactor: 1,
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', scale: 'css' },
  },
  projects: browsers.flatMap(([name, device]) => sizes.map(([size, viewport]) => ({
    name: `${name}-${size}`,
    use: { ...device, viewport, deviceScaleFactor: 1 },
  }))),
})
