// Scene art (prompts/scenes; docs/theme-packs.md §4, §9) on the packs that have it:
// the countdown in its painting, props beside the headings, the attire pair
// when a couple shows no photos, and the evening closing. A pack without the
// slots keeps the page it always had.
import fs from 'fs'
import { test, expect } from '@playwright/test'
import { NOW, SLUG, settle, stubInvitation, waitRevealed } from './stub.js'

const PAGE = `/${SLUG}?to=Budi+Santoso`
const SECTION_CSS = new URL('./sections.css', import.meta.url).pathname
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/invitation.json', import.meta.url), 'utf8'))
const PILOTS = [['minang', 3], ['javanese', 4], ['betawi', 4], ['arch', 4]]   // pack, number of props

async function open(page, overrides) {
  await page.clock.setFixedTime(NOW)
  await stubInvitation(page, overrides)
  await page.goto(PAGE)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
}

// True when `inner` lies within `outer` (1px of rounding allowed).
const within = (inner, outer) => inner.x >= outer.x - 1 && inner.y >= outer.y - 1 &&
  inner.x + inner.width <= outer.x + outer.width + 1 && inner.y + inner.height <= outer.y + outer.height + 1

for (const [theme, props] of PILOTS) {
  test(`${theme}: the countdown and the monogram sit inside their paintings' calm areas`, async ({ page }) => {
    await open(page, { theme })
    const scene = page.locator('.pk-scene--scene-interlude')
    await expect(scene.locator('img')).toHaveCount(1)
    expect(within(await scene.locator('.countdown-grid').boundingBox(), await scene.locator('.pk-scene-calm').boundingBox())).toBe(true)

    const closing = page.locator('.pk-closing[data-scene] .pk-scene--closing-scene')
    expect(within(await closing.locator('.pk-monogram').boundingBox(), await closing.locator('.pk-scene-calm').boundingBox())).toBe(true)
    await expect(page.locator('.pk-closing .pk-corner')).toHaveCount(0)   // the scene takes the corners' place
    await expect(page.locator('.pk-section-prop')).toHaveCount(props)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })

  test(`${theme}: without photos, the attire pair stands in for the portraits`, async ({ page }) => {
    await open(page, { theme, couple: { ...fixture.couple, bride_photo: null, groom_photo: null } })
    const wrap = page.locator('.pk-section-wrap', { has: page.locator('.profile-section') })
    await waitRevealed(page, wrap)
    await expect(wrap.locator('.pk-slot-attire-bride img')).toBeVisible()
    await expect(wrap.locator('.pk-slot-attire-groom img')).toBeVisible()
    await expect(wrap.locator('.pk-photo-frame')).toHaveCount(0)
    await settle(page, '.pk-root')
    await expect(wrap).toHaveScreenshot(`${theme}-profiles-without-photos.png`, { stylePath: SECTION_CSS })
  })
}

test('a pack without scene art renders none of it', async ({ page }) => {
  await open(page, { theme: 'sage' })
  await expect(page.locator('.pk-scene, .pk-section-prop, .pk-attire')).toHaveCount(0)
  await expect(page.locator('.pk-closing')).not.toHaveAttribute('data-scene')
  await expect(page.locator('.pk-closing .pk-corner')).not.toHaveCount(0)
})
