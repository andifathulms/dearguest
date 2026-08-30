import { test, expect } from '@playwright/test'

// Each demo invitation, captured at the two highest-impact moments:
// the cover gate ("Buka Undangan") and the opened hero.
const THEMES = [
  'demo-javanese',
  'demo-floral',
  'demo-minimalis',
  'demo-emerald',
  'demo-rustic',
  'demo-boho',
  'demo-marun',
  'demo-biru',
  'demo-langit',
  'demo-sage',
  'demo-mauve',
  'demo-gading',
  'demo-tropis',
  'demo-lembayung',
  'demo-koral',
  'demo-marmer',
  'demo-arabesque',
  'demo-navy',
  'demo-plum',
  'demo-teal',
  'demo-deco',
  'demo-matahari',
  'demo-beige',
  'demo-rosegold',
  'demo-mono',
  'demo-ungu',
  'demo-marmerputih',
  'demo-bugis',
]

for (const slug of THEMES) {
  test(`${slug} — cover & hero`, async ({ page }) => {
    await page.goto(`/${slug}?to=Budi+Santoso`)
    await page.waitForLoadState('networkidle')
    // Wait for fonts/photos and the entrance animation to settle.
    await page.waitForTimeout(1800)

    // Remotion backdrops are driven by JS, so Playwright's `animations:
    // 'disabled'` can't freeze them. Pin to a fixed frame for a stable
    // snapshot. No-op on themes without a motion backdrop.
    await page.evaluate(() => {
      if (window.__backdrop) {
        window.__backdrop.pause()
        window.__backdrop.seekTo(180)
      }
    })
    await page.waitForTimeout(400)

    await expect(page).toHaveScreenshot(`${slug}-1-cover.png`)

    const open = page.locator('.cover-open-btn')
    await open.click()
    await page.waitForTimeout(1600)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot(`${slug}-2-hero.png`)
  })
}
