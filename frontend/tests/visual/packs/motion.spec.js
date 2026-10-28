// Shared pack motion (docs/theme-packs.md §9): the cover exit, the hero
// curtain, the signature loops and the reveals. Behaviour only, no baselines:
// every pack's screenshots already prove the resting state is unchanged.
import { test, expect } from '@playwright/test'
import { NOW, SLUG, settle, stubInvitation, waitRevealed } from './stub.js'

async function load(page, theme) {
  await page.clock.setFixedTime(NOW)
  await stubInvitation(page, { theme })
  await page.goto(`/${SLUG}?to=Budi+Santoso`)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
}

const transformOf = (page, sel) => page.locator(sel).first().evaluate(el => getComputedStyle(el).transform)

test('the cover leaves by the pack\'s exit, then the overlay is gone', async ({ page }) => {
  await load(page, 'javanese')
  await page.locator('.pk-open-btn').click()
  const exit = page.locator('.pk-opening-exit')
  await expect(exit).toHaveAttribute('data-exit', 'doors')
  await expect(exit.locator('.pk-exit-piece')).toHaveCount(2)
  await expect(exit).toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
  await expect(page.locator('body')).not.toHaveClass(/cover-open/)
})

test('the hero curtain rests at the top and moves on scroll', async ({ page }) => {
  await load(page, 'sunda')
  await expect(page.locator('.pk-root')).toHaveAttribute('data-signature', 'drift sway')
  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page, '.pk-hero')
  const band = (await page.viewportSize()).width < 1000 ? '.pk-hero-band--top' : '.pk-hero-bg'
  await expect.poll(() => transformOf(page, band)).toBe('none')
  await page.evaluate(() => window.scrollTo(0, innerHeight * 0.5))
  await expect.poll(() => transformOf(page, band)).not.toBe('none')
})

test('reveals end at the resting style (no clip, no transform)', async ({ page }) => {
  await load(page, 'sage')
  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
  const wrap = page.locator('.pk-section-wrap').filter({ has: page.locator('.gallery-section') })
  await waitRevealed(page, wrap)
  const styles = await wrap.evaluate(el => [...el.querySelectorAll('.section-title, .pk-ornament-reveal, .gallery-item')]
    .map(n => `${getComputedStyle(n).clipPath}|${getComputedStyle(n).transform}`))
  expect(styles.length).toBeGreaterThan(2)
  for (const s of styles) expect(s).toBe('none|none')
})

test('reduced motion: the cover just fades and nothing loops', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await load(page, 'sunda')
  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening-exit')).toHaveAttribute('data-exit', 'fade')
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
  const anim = await page.locator('.pk-hero-band--top img, .pk-hero-bg img').first().evaluate(el => getComputedStyle(el).animationName)
  expect(anim).toBe('none')
  await context.close()
})
