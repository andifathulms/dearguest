// Phase 2 (market fit) states of the Minimal pack — Linux baselines, run in
// Docker (`make visual`): religion copy variants, event timezones seen from
// another zone, tap-to-load maps, the lightbox, RSVP update + guest limit,
// structured parents with Alm./Almh. + Instagram, and the gift address card.
import fs from 'fs'
import { test, expect } from '@playwright/test'
import { NOW, SLUG, settle, stubInvitation, waitRevealed } from './stub.js'

const SECTION_CSS = new URL('./sections.css', import.meta.url).pathname

async function open(page, query = '?to=Budi+Santoso') {
  await page.goto(`/${SLUG}${query}`)
  await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
  await page.locator('.pk-open-btn').click()
  await expect(page.locator('.pk-opening')).toHaveCount(0, { timeout: 10_000 })
}

// Centre the section's wrapper and wait for its in-view reveal (stub.js waitRevealed).
async function reveal(page, selector) {
  const wrap = page.locator('.pk-section-wrap').filter({ has: page.locator(selector) })
  await waitRevealed(page, wrap)
  await settle(page, '.pk-root')
  return wrap
}

async function shot(page, selector, name) {
  const wrap = await reveal(page, selector)
  await expect(wrap).toHaveScreenshot(name, { stylePath: SECTION_CSS })
}

const firstEvent = { islam: 'akad', kristen: 'pemberkatan', katolik: 'sakramen', umum: 'resepsi' }

// The fixture as stubInvitation serves it, for building overrides.
const FIXTURE = JSON.parse(fs.readFileSync(new URL('./fixtures/invitation.json', import.meta.url), 'utf8'))
const withFirstEvent = type => FIXTURE.events.map((e, i) => (i === 0 ? { ...e, event_type: type } : e))

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
})

for (const variant of ['islam', 'kristen', 'katolik', 'umum']) {
  test(`copy variant: ${variant}`, async ({ page }) => {
    await stubInvitation(page, { copy_variant: variant, events: withFirstEvent(firstEvent[variant]) })
    await open(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await settle(page, '.pk-hero')
    await expect(page).toHaveScreenshot(`variant-${variant}-hero.png`)

    const text = await page.locator('.pk-root').innerText()
    if (variant === 'islam') {
      await expect(page.locator('.hero-bismillah[lang=ar]')).toHaveCount(1)
      await expect(page.locator('.scripture-ref')).toHaveText('QS. Ar-Rum: 21')
      await expect(page.locator('.scripture-source')).toContainText('Tanzil')
    } else {
      await expect(page.locator('[lang=ar]')).toHaveCount(0)
      expect(text).not.toMatch(/Assalamualaikum|Bismillah|Alhamdulillah|Jazakumullah|Insya Allah/i)
    }
    if (variant === 'kristen') await expect(page.locator('.scripture-ref')).toHaveText('Kejadian 2:24')
    if (variant === 'katolik') await expect(page.locator('.scripture-ref')).toHaveText('Matius 19:6')
    if (variant === 'umum') {
      await expect(page.locator('.scripture-section')).toHaveCount(0)
      expect(text).not.toMatch(/Tuhan memberkati|Puji Tuhan|Syukur kepada Tuhan/i)
    } else {
      await shot(page, '.scripture-section', `variant-${variant}-scripture.png`)
    }
    await shot(page, '.events-section', `variant-${variant}-events.png`)
  })
}

test('a WITA event seen from a WIB device shows both times', async ({ page }) => {
  const [akad, resepsi] = FIXTURE.events
  await stubInvitation(page, {
    events: [
      { ...akad, timezone: 'Asia/Makassar', start: '2026-12-12T09:00:00+08:00', end: '2026-12-12T11:00:00+08:00' },
      { ...resepsi, timezone: 'Asia/Makassar', start: '2026-12-12T18:00:00+08:00', end: null },
    ],
  })
  await open(page)   // the project's timezoneId is Asia/Jakarta (WIB)
  const cards = page.locator('.event-card')
  await expect(cards.nth(0).locator('.event-time')).toHaveText('09.00 – 11.00 WITA')
  await expect(cards.nth(0).locator('.event-local-time')).toContainText('08.00 WIB')
  await expect(cards.nth(1).locator('.event-time')).toHaveText('18.00 WITA s.d. selesai')
  await shot(page, '.events-section', 'events-wita-from-wib.png')
})

test.describe('a guest west of UTC', () => {
  test.use({ timezoneId: 'America/Los_Angeles' })

  test('sees the right calendar day and a local-time line', async ({ page }) => {
    await stubInvitation(page)
    await page.goto(`/${SLUG}?to=Budi`)
    await expect(page.locator('.pk-opening')).toHaveAttribute('data-state', 'done', { timeout: 10_000 })
    await expect(page.locator('.pk-cover')).toContainText('12 Desember 2026')
    await page.locator('.pk-open-btn').click()
    await expect(page.locator('.event-card').first().locator('.event-date')).toHaveText('Sabtu, 12 Desember 2026')
    await expect(page.locator('.event-card').first().locator('.event-local-time')).toBeVisible()
  })
})

test('maps load only when asked; "Buka Peta" is always there', async ({ page }) => {
  await stubInvitation(page)
  await open(page)
  const maps = await reveal(page, '.map-load')   // (the livestream block reuses .maps-section)
  await expect(maps.locator('iframe')).toHaveCount(0)
  await expect(maps.locator('.map-open').first()).toHaveAttribute('href', /query=-7\.803820,110\.362392/)
  await maps.locator('.map-load').first().click()
  await expect(maps.locator('iframe').first()).toHaveAttribute('src', /^https:\/\/www\.google\.com\/maps\?q=-7\.803820/)
  await expect(maps).toHaveScreenshot('maps-one-loaded.png', { stylePath: SECTION_CSS })
})

test('lightbox: counter, keys, swipe, back button', async ({ page }) => {
  await stubInvitation(page)
  await open(page)
  const gallery = await reveal(page, '.gallery-section')
  await gallery.locator('.gallery-item img').first().click({ force: true })
  const box = page.locator('.lightbox[role=dialog]')
  await expect(box.locator('.lightbox-counter')).toHaveText('1 / 5')
  await expect(box.locator('.lightbox-close')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(box.locator('.lightbox-counter')).toHaveText('2 / 5')
  await settle(page, '.lightbox')   // measure the photo only once it has loaded and laid out
  const img = await box.locator('.lightbox-fig img').boundingBox()
  await page.mouse.move(img.x + img.width * 0.85, img.y + img.height / 2)
  await page.mouse.down()
  await page.mouse.move(img.x + img.width * 0.15, img.y + img.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(box.locator('.lightbox-counter')).toHaveText('3 / 5')
  await settle(page, '.lightbox')
  await expect(page).toHaveScreenshot('lightbox.png')
  await page.goBack()
  await expect(box).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe(`/${SLUG}`)
})

test('RSVP: personal-link limit, then "Jawaban diperbarui"', async ({ page }) => {
  await stubInvitation(page, {}, {
    guests: { abc12345: { name: 'Budi Santoso', max_pax: 2 } },
    rsvp: { status: 200, json: { updated: true, wish_status: 'pending' } },
  })
  await open(page, '?g=abc12345')
  const rsvp = await reveal(page, '.rsvp-section')
  await expect(rsvp.locator('input[name=guest_name]')).toHaveValue('Budi Santoso')
  await expect(rsvp.locator('.rsvp-pax-limit')).toHaveText('Undangan ini untuk 2 orang')
  await expect(rsvp).toHaveScreenshot('rsvp-limit.png', { stylePath: SECTION_CSS })
  await rsvp.locator('.rsvp-submit').click()
  await expect(rsvp.locator('.rsvp-success')).toContainText('Jawaban diperbarui')
  await expect(rsvp.locator('.rsvp-pending')).toBeVisible()
  await expect(rsvp).toHaveScreenshot('rsvp-updated.png', { stylePath: SECTION_CSS })
})

test('profiles with Alm./Almh. and Instagram; gift address card', async ({ page }) => {
  const { couple } = FIXTURE
  await stubInvitation(page, {
    couple: { ...couple, bride_father_deceased: true, groom_mother_deceased: true, bride_instagram: 'andini.s' },
    gift_recipient: 'Andini', gift_address: 'Jl. Melati No. 3, Kotabaru\nYogyakarta 55224', gift_phone: '0812-3456-7890',
  })
  await open(page)
  const profile = await reveal(page, '.profile-section')
  await expect(profile).toContainText('Putri pertama dari')
  await expect(profile).toContainText('Bapak Suryadi (Alm.) & Ibu Lestari')
  await expect(profile).toContainText('Putra kedua dari')
  await expect(profile).toContainText('Ibu Wulandari (Almh.)')
  await expect(profile.locator('.profile-instagram')).toHaveAttribute('href', 'https://www.instagram.com/andini.s/')
  await expect(profile).toHaveScreenshot('profile-late-instagram.png', { stylePath: SECTION_CSS })
  const gift = await reveal(page, '.gift-address-card')
  await expect(gift.locator('.gift-address-card')).toContainText('Yogyakarta 55224')
  await expect(gift).toHaveScreenshot('gift-address.png', { stylePath: SECTION_CSS })
})
