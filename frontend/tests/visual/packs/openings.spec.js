// Opening types beyond Minimal's own `css` intro, driven by fixture files
// through the dev overrides ?openingType / ?openingSrc / ?openingPreset.
import { test, expect } from '@playwright/test'
import { NOW, SLUG, stubInvitation } from './stub.js'

const PAGE = `/${SLUG}?to=Budi+Santoso`
const fixture = name => new URL(`./fixtures/openings/${name}`, import.meta.url).pathname
const LOTTIE = 'http://fixtures.test/openings/fade.lottie.json'
const DOORS = 'http://fixtures.test/openings/doors.svg'

let requests
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await stubInvitation(page)
  await page.route('http://fixtures.test/openings/*', route => {
    const name = new URL(route.request().url()).pathname.split('/').pop()
    return route.fulfill({ path: fixture(name), contentType: name.endsWith('.svg') ? 'image/svg+xml' : 'application/json' })
  })
  requests = []
  page.on('request', r => requests.push(r.url()))
})

const loadedLottiePlayer = () => requests.some(u => /lottie/i.test(u) && !u.includes('fixtures.test'))

test('a css opening never downloads the Lottie player', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
  expect(loadedLottiePlayer()).toBe(false)
})

test('lottie: plays the opening file to its end, then the cover is ready', async ({ page }) => {
  await page.goto(`${PAGE}&openingType=lottie&openingSrc=${LOTTIE}`)
  await expect(page.locator('.pk-opening-lottie svg')).toHaveCount(1)
  expect(loadedLottiePlayer()).toBe(true)
  // The fixture is 1 s long; the gate is "done" when Lottie reports complete.
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
})

test('lottie: ?openingAt pins the animation mid-way', async ({ page }) => {
  await page.goto(`${PAGE}&openingType=lottie&openingSrc=${LOTTIE}&openingAt=0.5`)
  await expect(page.locator('.pk-opening-lottie svg')).toHaveCount(1)
  // The fixture fades a veil from opacity 1 to 0; half-way it's in between.
  const opacity = await page.locator('.pk-opening-lottie svg g[opacity]').first().getAttribute('opacity')
  expect(Number(opacity)).toBeGreaterThan(0.1)
  expect(Number(opacity)).toBeLessThan(0.9)
})

test('layered-svg: the doors-part preset moves the named layers', async ({ page }) => {
  await page.goto(`${PAGE}&openingType=layered-svg&openingPreset=doors-part&openingSrc=${DOORS}&openingAt=0.6`)
  const left = page.locator('#door-left')
  await expect(left).toHaveCount(1)
  const tx = sel => page.locator(sel).evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41)
  const leftX = await tx('#door-left')
  const rightX = await tx('#door-right')
  expect(leftX).toBeLessThan(0)        // left door slides left…
  expect(rightX).toBeGreaterThan(0)    // …right door slides right
})

test('reduced motion shows the end state of a layered opening at once', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.clock.setFixedTime(NOW)
  await stubInvitation(page)
  await page.route('http://fixtures.test/openings/*', route => route.fulfill({ path: fixture('doors.svg'), contentType: 'image/svg+xml' }))
  await page.goto(`${PAGE}&openingType=layered-svg&openingPreset=doors-part&openingSrc=${DOORS}`)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done')
  await expect(page.locator('#door-left')).toHaveCount(1)
  // finish() puts each layer at its last keyframe: fully open.
  await expect.poll(() => page.locator('#door-left').evaluate(el => getComputedStyle(el).transform)).not.toBe('none')
  await context.close()
})
