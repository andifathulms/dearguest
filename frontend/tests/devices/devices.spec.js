// The guest's whole journey and the couple's phone flows under phone
// emulation; on Android with a 4x slower CPU and slow 4G (CDP). Uses the
// visual suite's hermetic API stubs.
import { test, expect } from '@playwright/test'
import { NOW, SLUG, stubInvitation } from '../visual/packs/stub.js'

const MP3 = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(413)])

test.beforeEach(async ({ page, context, browserName }, testInfo) => {
  await page.clock.setFixedTime(NOW)
  if (testInfo.project.use.throttle && browserName === 'chromium') {
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
    })
  }
})

test('guest: personal link, opening, music, every section, calendar, map, gallery, gift, RSVP, wishes', async ({ page }) => {
  await stubInvitation(page, { music_file: 'http://fixtures.test/lagu.mp3' },
    { guests: { K7MPQ2: { code: 'K7MPQ2', name: 'Bapak Ahmad Fauzi', max_pax: 2 } } })
  await page.route('http://fixtures.test/lagu.mp3', route => route.fulfill({ body: MP3, contentType: 'audio/mpeg' }))

  await page.goto(`/${SLUG}/K7MPQ2`)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 60_000 })
  await expect(page.locator('.pk-opening')).toContainText('Bapak Ahmad Fauzi')
  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 30_000 })

  // Opening the invitation starts the music; the button mutes and unmutes it.
  const music = page.locator('.music-btn')
  await expect(music).toHaveClass(/music-playing/)
  await music.click()
  await expect(music).not.toHaveClass(/music-playing/)
  await music.click()
  await expect(music).toHaveClass(/music-playing/)

  // Every section comes into view and finishes its reveal.
  const sections = page.locator('.pk-section-wrap')
  const count = await sections.count()
  expect(count).toBeGreaterThan(6)
  for (let i = 0; i < count; i++) {
    await sections.nth(i).scrollIntoViewIfNeeded()
    await expect(sections.nth(i)).toHaveCSS('opacity', '1')
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  await expect(page.locator('a[href$="calendar.ics"]').first()).toHaveAttribute('href', /\/api\/invitations\/.+\/events\/\d+\/calendar\.ics$/)

  const mapButton = page.locator('.map-load').first()
  await mapButton.scrollIntoViewIfNeeded()
  await mapButton.click()
  await expect(page.locator('.maps-section iframe').first()).toHaveAttribute('src', /google\.com\/maps/)

  const photo = page.locator('.gallery-item img').first()
  await photo.scrollIntoViewIfNeeded()
  await photo.click({ force: true })
  const box = page.locator('.lightbox[role=dialog]')
  await expect(box.locator('.lightbox-counter')).toHaveText('1 / 5')
  const img = await box.locator('.lightbox-fig img').boundingBox()
  await page.mouse.move(img.x + img.width * 0.85, img.y + img.height / 2)
  await page.mouse.down()
  await page.mouse.move(img.x + img.width * 0.15, img.y + img.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(box.locator('.lightbox-counter')).toHaveText('2 / 5')
  await box.locator('.lightbox-close').click()

  // Copying works even without the Clipboard API (the test server is plain
  // http, like WhatsApp's older in-app browsers): utils/clipboard.js falls back.
  const copy = page.locator('.bank-copy-btn').first()
  await copy.scrollIntoViewIfNeeded()
  await copy.click()
  await expect(copy).toContainText('✓')

  const rsvp = page.locator('.rsvp-section')
  await rsvp.scrollIntoViewIfNeeded()
  await expect(rsvp.locator('input[name=guest_name]')).toHaveValue('Bapak Ahmad Fauzi')
  await rsvp.locator('.rsvp-submit').click()
  await expect(rsvp.locator('.rsvp-success')).toBeVisible()

  await page.locator('.wishes-section').scrollIntoViewIfNeeded()
  await expect(page.locator('.wish-card').first()).toContainText('Sari & Keluarga')
})

test('couple on a phone: guest list counts and the WhatsApp send queue', async ({ page }) => {
  const guests = [
    { id: 1, name: 'Bapak Ahmad Fauzi', whatsapp: '6281234567890', group: 'Keluarga', code: 'K7MPQ2', sent_at: null, open_count: 0, responded: false, checked_in: false, max_pax: null },
  ]
  await page.addInitScript(() => { window.__opened = []; window.open = url => { window.__opened.push(url); return null } })
  await page.route(url => url.pathname.startsWith('/api/'), route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith(`/my/invitations/${SLUG}/`)) return route.fulfill({ json: { slug: SLUG, copy_variant: 'islam', couple: { bride_name: 'Andini', groom_name: 'Bagus' }, events: [], wa_templates: {}, features: { wa_blast: true } } })
    if (path.endsWith(`/invitations/${SLUG}/guests/`)) return route.fulfill({ json: { guests, stats: { total: 1, checked_in: 0, sent: 0, opened: 0, responded: 0 } } })
    if (path.endsWith(`/invitations/${SLUG}/rsvps/`)) return route.fulfill({ json: { rsvps: [], stats: {} } })
    if (/\/guests\/1\/$/.test(path)) return route.fulfill({ json: guests[0] })
    return route.fulfill({ status: 404, json: {} })
  })
  await page.goto(`/dashboard/${SLUG}`)
  await page.getByRole('button', { name: /Daftar Tamu/ }).click()
  await expect(page.locator('.gm-stat').first()).toContainText('1')
  await page.goto(`/dashboard/${SLUG}/kirim`)
  await page.getByRole('button', { name: 'Kirim via WhatsApp' }).click()
  expect(await page.evaluate(() => window.__opened[0])).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
