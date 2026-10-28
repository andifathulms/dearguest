// Sage pack (Taman Sage) — Linux baselines (run in Docker: `make visual`).
// Projects: Chromium + WebKit at 360×800, 390×844 and 1440×900
// (playwright.packs.config.js). The API is stubbed (stub.js); the fixture's
// theme is switched to `sage`.
import { test, expect } from '@playwright/test'
import { NOW, SLUG, settle, stubInvitation, waitRevealed } from './stub.js'

const PAGE = `/${SLUG}?to=Budi+Santoso`
const SECTION_CSS = new URL('./sections.css', import.meta.url).pathname

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await stubInvitation(page, { theme: 'sage' })
})

async function openInvitation(page) {
  await page.goto(PAGE)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
  await settle(page)
  return page
}

test('painted cover, then the framed hero', async ({ page }) => {
  await openInvitation(page)
  await expect(page.locator('.pk-cover--painted')).toBeVisible()
  await expect(page.locator('.cover-guest-name')).toHaveText('Budi Santoso')
  await expect(page).toHaveScreenshot('cover.png')

  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page, '.pk-hero')
  // The couple's photo sits in the wreath; the names stay clear of the flowers.
  await expect(page.locator('.pk-hero--framed .pk-hero-portrait img.profile-photo')).toBeVisible()
  await expect(page).toHaveScreenshot('hero.png')
})

test('every section', async ({ page }) => {
  await openInvitation(page)
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

test('petals fall but never block a tap; none under reduced motion', async ({ page }) => {
  await openInvitation(page)
  const petals = page.locator('.pk-particle')
  await expect(petals).toHaveCount(7)
  expect(await page.locator('.pk-particles').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.pk-particles')).toBeHidden()
})

test('no horizontal scroll, no emoji', async ({ page }) => {
  await openInvitation(page)
  await page.locator('.pk-open-btn').click()
  const text = await page.locator('.pk-root').innerText()
  expect(text).not.toMatch(/\p{Extended_Pictographic}/u)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  // The floating RSVP button clears the bottom safe area.
  const rsvp = await page.locator('.floating-rsvp').boundingBox()
  expect(rsvp.y + rsvp.height).toBeLessThanOrEqual(page.viewportSize().height - 16)
})
