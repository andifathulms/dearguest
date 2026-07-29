import { test, expect } from '@playwright/test'

// The javanese-dark shared motion clock: the ambient Remotion layer and the
// three things it drives (cover reveal, story spine, gallery drift).
// These stub the API, so they run without the backend stack.

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const INVITATION = {
  slug: 'demo-javanese',
  theme: 'javanese-dark',
  wedding_date: '2026-11-14',
  opening_text: 'Dengan memohon rahmat Allah SWT.',
  closing_text: '',
  watermark: true,
  music_file: null,
  hero_photo: null,
  dress_code: '',
  wishlist_url: '',
  livestream_url: '',
  couple: {
    bride_name: 'Anindya',
    groom_name: 'Raka',
    bride_parents: '',
    groom_parents: '',
    bride_photo: null,
    groom_photo: null,
    bride_bio: '',
    groom_bio: '',
  },
  events: [
    {
      event_type: 'akad',
      datetime: '2026-11-14T08:00:00Z',
      venue_name: 'Pendopo Agung',
      address: 'Yogyakarta',
      gmaps_url: '',
      gmaps_embed_url: '',
    },
  ],
  stories: [
    { id: 1, title: 'Pertemuan', description: 'Kami bertemu.', date: '2020-03-01', order: 0 },
    { id: 2, title: 'Perjalanan', description: 'Kami tumbuh bersama.', date: '2022-06-01', order: 1 },
    { id: 3, title: 'Lamaran', description: 'Dia berkata iya.', date: '2025-12-01', order: 2 },
  ],
  photos: [
    { id: 1, image: PIXEL, caption: '', order: 0 },
    { id: 2, image: PIXEL, caption: '', order: 1 },
    { id: 3, image: PIXEL, caption: '', order: 2 },
    { id: 4, image: PIXEL, caption: '', order: 3 },
  ],
  bank_accounts: [],
}

async function stubApi(page) {
  await page.route(/\/api\/invitations\//, route =>
    route.fulfill({ json: route.request().url().includes('/wishes') ? [] : INVITATION })
  )
}

const opacityOf = (page, sel) =>
  page.evaluate(s => getComputedStyle(document.querySelector(s)).opacity, sel)

/** Open the cover and wait for the invitation body to be interactive. */
async function openInvitation(page) {
  await page.locator('.cover-open-btn').click()
  // The gate fades out over 0.8s, and a loaded machine can take longer than
  // the 5s default to get there.
  await expect(page.locator('.cover-gate')).toHaveCount(0, { timeout: 15000 })
}

test('ambient layer plays behind an unchanged cover card', async ({ page }) => {
  await stubApi(page)
  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })

  // The motion layer is a lazy chunk, so allow for a slow fetch rather than
  // the 5s default.
  await expect(page.locator('.jd-ambient')).toHaveCount(1, { timeout: 15000 })

  // The card is real DOM, not painted into the composition — this is the whole
  // point of the layered approach, so assert every part of it survives.
  await expect(page.locator('.cover-inner')).toBeVisible()
  await expect(page.locator('.cover-ornaments')).toHaveCount(1)
  await expect(page.locator('.cover-divider')).toHaveCount(1)
  await expect(page.locator('.cover-names')).toContainText('Anindya')
  await expect(page.locator('.cover-guest-name')).toHaveText('Budi Santoso')

  // Playback must actually start — `autoPlay` alone is blocked in some
  // browsers, so AmbientStage drives play() itself. `window.__backdrop` is a
  // dev-only handle, so this needs the Vite dev server (the default baseURL),
  // not a production preview build.
  await page.waitForFunction(() => window.__backdrop?.isPlaying?.(), null, { timeout: 15000 })

  await openInvitation(page)
})

test('card reveal is staggered across the shared frame clock', async ({ page }) => {
  await stubApi(page)
  // Pinned at frame 45 from the start — seeking after load races the reveal,
  // which settles after ~6s and then cannot be inspected again.
  await page.goto('/demo-javanese?to=Budi+Santoso&frame=45', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__backdrop, null, { timeout: 15000 })
  await page.waitForTimeout(400)

  // Mid-reveal: the label has landed, the closing beats have not. If these ever
  // match, the stagger has collapsed back into a single fade.

  expect(Number(await opacityOf(page, '.cover-label'))).toBeGreaterThan(0.8)
  expect(Number(await opacityOf(page, '.cover-name-bride'))).toBeGreaterThan(0.2)
  expect(Number(await opacityOf(page, '.cover-name-groom'))).toBeLessThan(0.05)
  expect(Number(await opacityOf(page, '.cover-open-btn'))).toBeLessThan(0.05)

  // Settled: everything is up.
  await page.evaluate(() => window.__backdrop.seekTo(180))
  await page.waitForTimeout(300)
  for (const sel of ['.cover-label', '.cover-name-bride', '.cover-name-groom', '.cover-date', '.cover-guest', '.cover-open-btn']) {
    expect(Number(await opacityOf(page, sel))).toBeGreaterThan(0.9)
  }
})

test('card does not re-reveal when the 20s composition loops', async ({ page }) => {
  await stubApi(page)
  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__backdrop, null, { timeout: 15000 })

  // Let the reveal complete, then jump back to the start of the loop — the
  // ambient composition restarts, the card must not.
  await page.evaluate(() => { window.__backdrop.pause(); window.__backdrop.seekTo(200) })
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__backdrop.seekTo(5))
  await page.waitForTimeout(400)

  for (const sel of ['.cover-label', '.cover-name-bride', '.cover-name-groom', '.cover-open-btn']) {
    expect(Number(await opacityOf(page, sel))).toBeGreaterThan(0.9)
  }
})

test('ambient layer outlives the cover gate', async ({ page }) => {
  await stubApi(page)
  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__backdrop?.isPlaying?.(), null, { timeout: 15000 })

  await openInvitation(page)

  // Still mounted, still playing, and stepped back so it does not compete with
  // the invitation body. Previously the whole Remotion runtime was fetched,
  // played for six seconds and discarded here.
  await expect(page.locator('.jd-ambient')).toHaveCount(1, { timeout: 15000 })
  await expect(page.locator('.jd-ambient--content')).toHaveCount(1, { timeout: 15000 })
  expect(await page.evaluate(() => window.__backdrop.isPlaying())).toBe(true)
  expect(Number(await opacityOf(page, '.jd-ambient'))).toBeLessThan(0.6)
})

test('story spine scrubs to scroll position', async ({ page }) => {
  await stubApi(page)
  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__backdrop, null, { timeout: 15000 })
  await openInvitation(page)

  const drawAt = () =>
    page.evaluate(() => {
      const el = document.querySelector('.story-timeline')
      return Number(getComputedStyle(el).getPropertyValue('--spine-draw')) || 0
    })

  // Scroll targets are computed from the element at scroll time. A blind
  // scrollIntoView + scrollBy drifts when content above the timeline changes
  // height as images settle, which can leave the page above the timeline
  // entirely — reading 0 for both samples.
  const scrollSo = where =>
    page.evaluate(w => {
      const el = document.querySelector('.story-timeline')
      const r = el.getBoundingClientRect()
      const top = r.top + window.scrollY
      window.scrollTo(0, w === 'below' ? top - window.innerHeight * 0.95 : top + r.height - window.innerHeight * 0.3)
    }, where)

  // Timeline still below the fold: undrawn.
  await scrollSo('below')
  await page.waitForTimeout(300)
  const early = await drawAt()

  // Scrolled through it: drawn further. This is the scroll-scrubbed timeline —
  // the one place the clock is deliberately not the frame counter.
  //
  // Re-scrolls on every poll: sections below the story can still be settling,
  // which moves the timeline out from under a one-shot scroll and reads 0.
  await expect
    .poll(async () => {
      await scrollSo('past')
      return drawAt()
    }, { timeout: 10000 })
    .toBeGreaterThan(early)

  expect(await drawAt()).toBeLessThanOrEqual(1)
})

test('gallery photos drift on the frame clock', async ({ page }) => {
  await stubApi(page)
  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__backdrop, null, { timeout: 15000 })
  await openInvitation(page)

  await page.locator('.gallery-grid').scrollIntoViewIfNeeded()

  const transformAt = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('.gallery-item img')).transform)

  const a = await transformAt()
  expect(a).not.toBe('none')

  // Time-based, not scroll-based: it keeps moving while the guest sits still.
  await page.waitForTimeout(900)
  const b = await transformAt()
  expect(b).not.toBe(a)
})

test('invitation survives the motion chunk failing to load', async ({ page }) => {
  await stubApi(page)
  // Kill the lazy motion chunk outright. Suspense only handles the *pending*
  // state of a lazy import — a rejected fetch propagates past it, so without a
  // boundary this blanks the whole invitation.
  await page.route(/AmbientStage/, route => route.abort())

  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.cover-gate')

  await expect(page.locator('.jd-ambient')).toHaveCount(0)
  // The card starts hidden waiting for a driver that will never arrive; the
  // fallback timer has to un-hide it.
  await expect
    .poll(async () => Number(await opacityOf(page, '.cover-inner')), { timeout: 6000 })
    .toBeGreaterThan(0.9)
  await openInvitation(page)
  await expect(page.locator('.story-timeline')).toHaveCount(1)
})

test('a failed theme chunk shows a reload prompt, not a blank page', async ({ page }) => {
  await stubApi(page)
  // Themes are lazy chunks; a stale hash after a deploy rejects the import.
  // Suspense does not catch that, so without a boundary the whole invitation
  // unmounts and the guest gets a white screen.
  await page.route(/JavaneseDark\/index/, route => route.abort())

  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('.inv-status-title')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('button.inv-status-link')).toBeVisible()
})

test('reduced motion drops the motion layer but keeps the design', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await stubApi(page)
  await page.goto('/demo-javanese?to=Budi+Santoso', { waitUntil: 'domcontentloaded' })

  await page.waitForSelector('.cover-gate')
  await expect(page.locator('.jd-ambient')).toHaveCount(0)
  await expect(page.locator('.cover-inner')).toBeVisible()
  await expect(page.locator('.cover-names')).toBeVisible()
  await expect(page.locator('.cover-open-btn')).toBeVisible()

  await openInvitation(page)
  // Sections still render, just without any driven motion.
  await expect(page.locator('.story-timeline')).toHaveCount(1)
  await expect(page.locator('.gallery-item img').first()).toHaveCSS('transform', 'none')
})
