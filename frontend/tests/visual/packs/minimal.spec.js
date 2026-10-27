// Minimal pack — Linux baselines (run in Docker: `npm run test:visual:docker`).
// Projects: Chromium + WebKit at 360×800, 390×844 and 1440×900
// (playwright.packs.config.js). The API is stubbed (stub.js).
import { test, expect } from '@playwright/test'
import { NOW, SLUG, settle, stubInvitation, waitRevealed } from './stub.js'

const PAGE = `/${SLUG}?to=Budi+Santoso`
const SECTION_CSS = new URL('./sections.css', import.meta.url).pathname

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await stubInvitation(page)
})

test('opening: mid-way, finished cover, opened hero', async ({ page }) => {
  // Pinned at 50 %: photo half-resolved, names half typed (dev hook ?openingAt).
  await page.goto(`${PAGE}&openingAt=0.5`)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-pinned', '')
  await settle(page)
  // 'allow': the intro is already paused at 50 %; the default ('disabled')
  // would fast-forward the CSS animations to their end state.
  await expect(page).toHaveScreenshot('opening-mid.png', { animations: 'allow' })

  // The real flow: the intro finishes on its own.
  await page.goto(PAGE)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
  await settle(page)
  await expect(page.locator('.cover-guest-name')).toHaveText('Budi Santoso')
  await expect(page).toHaveScreenshot('cover.png')

  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page, '.pk-hero')
  await expect(page).toHaveScreenshot('hero.png')
})

test('every section', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })

  const wraps = page.locator('.pk-section-wrap')
  const count = await wraps.count()
  expect(count).toBeGreaterThanOrEqual(10)
  for (let i = 0; i < count; i++) {
    const wrap = wraps.nth(i)
    await waitRevealed(page, wrap)
    const name = await wrap.evaluate(el => el.firstElementChild?.className.split(' ')[0] || 'section')
    await settle(page, '.pk-root')
    await expect(wrap).toHaveScreenshot(`section-${String(i).padStart(2, '0')}-${name}.png`, { stylePath: SECTION_CSS })
  }
})

test('no emoji, no horizontal scroll, floating controls clear the safe area', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
  await page.locator('.pk-open-btn').click()
  const text = await page.locator('.pk-root').innerText()
  expect(text).not.toMatch(/\p{Extended_Pictographic}/u)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  const rsvp = await page.locator('.floating-rsvp').boundingBox()
  expect(rsvp.y + rsvp.height).toBeLessThanOrEqual(page.viewportSize().height - 16)
})
