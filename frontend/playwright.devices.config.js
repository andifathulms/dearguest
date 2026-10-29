import { defineConfig, devices } from '@playwright/test'

// Phone emulation with throttling, before the real-device pass (DEVICE-TEST.md):
// a low-end Android (Pixel 5 viewport, Chromium, CPU 4x slower and slow 4G
// via CDP in the spec) and an iPhone (WebKit; WebKit has no CPU/network
// throttling, so it runs at full speed). Functional checks only, no
// screenshots. Runs like the visual suite:
//   PW_CONFIG=playwright.devices.config.js sh scripts/visual-docker.sh
export default defineConfig({
  testDir: './tests/devices',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://frontend:5173',
    timezoneId: 'Asia/Jakarta',
    locale: 'id-ID',
  },
  projects: [
    { name: 'android-lowend', use: { ...devices['Pixel 5'], throttle: true } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
})
