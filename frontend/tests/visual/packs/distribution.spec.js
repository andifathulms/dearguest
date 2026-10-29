// Phase 4 (distribution): personal guest links and the open beacon, guest
// import, the WhatsApp send queue, sent/opened in the guest list, the theme
// gallery's preview loops and the theme detail page. 360 and 1440 only.
// The dashboard runs against a small stateful stub (stubDashboard below).
import fs from 'fs'
import { test, expect } from '@playwright/test'
import { NOW, SLUG, settle, stubInvitation } from './stub.js'

test.skip(({ viewport }) => viewport.width === 390, 'phone + desktop are enough for these flows')

const invitation = JSON.parse(fs.readFileSync(new URL('./fixtures/invitation.json', import.meta.url), 'utf8'))

const GUESTS = [
  { id: 1, name: 'Bapak Ahmad Fauzi', whatsapp: '6281234567890', group: 'Keluarga', code: 'K7MPQ2', sent_at: '2026-12-01T09:00:00Z', open_count: 2, first_opened_at: '2026-12-01T10:00:00Z', last_opened_at: '2026-12-02T10:00:00Z', responded: true, attending: true },
  { id: 2, name: 'Siti Aminah', whatsapp: '6281234567891', group: 'Kantor', code: 'P4WX9R', sent_at: '2026-12-01T09:05:00Z', open_count: 0, responded: false },
  { id: 3, name: 'Budi Santoso', whatsapp: '', group: 'Kantor', code: 'H3NT7E', sent_at: null, open_count: 0, responded: false },
]

async function stubDashboard(page) {
  const state = { guests: GUESTS.map(g => ({ max_pax: null, checked_in: false, ...g })), templates: {}, imported: null, opened: [] }
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test-token')
    window.__opened = []
    window.open = url => { window.__opened.push(url); return null }
  })
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    const body = () => JSON.parse(req.postData() || '{}')
    if (path.endsWith(`/my/invitations/${SLUG}/`)) {
      if (req.method() === 'PATCH') state.templates = body().wa_templates
      return route.fulfill({ json: { ...invitation, wa_templates: state.templates, features: { wa_blast: true, guest_import: true, open_tracking: true, personalised_preview: true } } })
    }
    if (path.endsWith(`/invitations/${SLUG}/guests/import/`)) {
      state.imported = body().rows
      return route.fulfill({ status: 201, json: { created: state.imported.length, skipped: [] } })
    }
    const one = path.match(/\/guests\/(\d+)\/$/)
    if (one && req.method() === 'PATCH') {
      const guest = state.guests.find(g => g.id === Number(one[1]))
      Object.assign(guest, body())
      return route.fulfill({ json: guest })
    }
    if (path.endsWith(`/invitations/${SLUG}/guests/`)) {
      const g = state.guests
      return route.fulfill({ json: { guests: g, stats: {
        total: g.length, checked_in: 0, sent: g.filter(x => x.sent_at).length,
        opened: g.filter(x => x.open_count).length, responded: g.filter(x => x.responded).length,
      } } })
    }
    if (path.endsWith(`/invitations/${SLUG}/rsvps/`)) return route.fulfill({ json: { rsvps: [], stats: {} } })
    return route.fulfill({ status: 404, json: { detail: 'not stubbed' } })
  })
  return state
}

test('personal link: name from the guest list, one open beacon, none on preview', async ({ page }) => {
  const beacons = []
  page.on('request', r => { if (r.url().includes('/open/')) beacons.push(r.method()) })
  await page.clock.setFixedTime(NOW)
  await stubInvitation(page, {}, { guests: { K7MPQ2: { code: 'K7MPQ2', name: 'Bapak Ahmad Fauzi', max_pax: 2 } } })
  await page.goto(`/${SLUG}/K7MPQ2?to=Nama%20Palsu`)
  await expect(page.locator('body')).toContainText('Bapak Ahmad Fauzi', { timeout: 30_000 })
  await expect(page.locator('body')).not.toContainText('Nama Palsu')
  await expect.poll(() => beacons.length).toBeGreaterThan(0)
  expect(new Set(beacons)).toEqual(new Set(['POST']))
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
})

test('import: paste, mapped columns, preview flags, save', async ({ page }) => {
  const state = await stubDashboard(page)
  await page.goto(`/dashboard/${SLUG}`)
  await page.getByRole('button', { name: /Daftar Tamu/ }).click()
  await page.getByLabel('Tempel daftar tamu').fill(
    'Nama\tNo HP\tGrup\tJumlah\nRina Wati\t0812 9999 0001\tAlumni\t2\nSiti Aminah\t0812 3456 7891\t\t\nTono\t12\t\t\n')
  await expect(page.locator('.gi-summary')).toContainText('1 tamu siap disimpan')
  await expect(page.locator('.gi-table tbody td:last-child')).toHaveText(['OK', 'Nomor sudah ada', 'Nomor WhatsApp tidak valid'])
  await expect(page.locator('.gi')).toHaveScreenshot('import-preview.png')
  await page.getByRole('button', { name: 'Simpan 1 tamu' }).click()
  await expect(page.locator('.gi-result')).toContainText('1 tamu ditambahkan')
  expect(state.imported).toEqual([{ name: 'Rina Wati', whatsapp: '6281299990001', group: 'Alumni', max_pax: 2 }])
})

test('guest list: sent and opened, filter "Terkirim tapi belum dibuka"', async ({ page }) => {
  await stubDashboard(page)
  await page.goto(`/dashboard/${SLUG}`)
  await page.getByRole('button', { name: /Daftar Tamu/ }).click()
  await expect(page.locator('.gm-stat')).toHaveText([/3\s*TOTAL TAMU/, /2\s*TERKIRIM/, /1\s*DIBUKA/, /1\s*SUDAH RSVP/, /0\s*SUDAH HADIR/])
  await expect(page.locator('.gm-row').first()).toContainText('dibuka 2×')
  await page.locator('.gm-filter select').selectOption('sent_unopened')
  await expect(page.locator('.gm-row-name')).toHaveText(['Siti Aminah'])
  await expect(page.locator('.gm-stats')).toHaveScreenshot('guest-stats.png')
})

test('send queue: WhatsApp deep link, back marks sent, undo, template typo', async ({ page }) => {
  const state = await stubDashboard(page)
  await page.clock.setFixedTime(NOW)
  await page.goto(`/dashboard/${SLUG}/kirim`)
  const card = page.getByTestId('sq-card')
  await expect(card.locator('.sq-name')).toHaveText('Budi Santoso')   // the only unsent guest
  await expect(card.locator('.sq-message')).toContainText('Assalamualaikum Wr. Wb.')
  await expect(card.locator('.sq-message')).toContainText('Akad Nikah: Sabtu, 12 Desember 2026, 08.00 WIB')
  await expect(card).toHaveScreenshot('queue-card.png', { mask: [card.locator('.sq-link'), card.locator('.sq-message')] })

  await page.getByRole('button', { name: 'Kirim via WhatsApp' }).click()
  const url = await page.evaluate(() => window.__opened[0])
  expect(url).toMatch(/^https:\/\/wa\.me\/\?text=Assalamualaikum/)   // no number: WhatsApp asks for the contact
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.sq-undo')).toContainText('Budi Santoso ditandai terkirim')
  await expect.poll(() => state.guests[2].sent_at).not.toBeNull()
  await expect(page.locator('.sq-done')).toContainText('Semua tamu di daftar ini sudah dikirimi')
  await page.getByRole('button', { name: 'Batalkan' }).click()
  await expect.poll(() => state.guests[2].sent_at).toBeNull()
  await expect(card.locator('.sq-name')).toHaveText('Budi Santoso')

  await page.getByRole('tab', { name: /Santai/ }).click()
  await page.getByLabel('Template casual').fill('Hai {nma}! {link}')
  await expect(page.locator('.sq-warn')).toContainText('Tidak dikenal: {nma}')
  await page.getByRole('button', { name: 'Pakai untuk kirim' }).click()
  await expect.poll(() => state.templates).toEqual({ active: 'casual', casual: 'Hai {nma}! {link}' })
})

test('/tema: stills first, the loop loads only on hover', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover')
  const videos = []
  page.on('request', r => { if (/\.(webm|mp4)$/.test(r.url())) videos.push(r.url()) })
  await page.goto('/tema')
  await settle(page)
  expect(videos).toEqual([])
  await expect(page.locator('.lp-theme-card').first()).toHaveScreenshot('gallery-card.png')
  await page.locator('.lp-theme-preview').first().hover()
  await expect.poll(() => videos.length).toBeGreaterThan(0)
})

test('/tema/:id: demo in a phone frame, variant toggle, "Pakai tema ini"', async ({ page }) => {
  const asked = []
  await stubInvitation(page)
  page.on('request', r => { if (r.url().includes(`/api/invitations/${SLUG}/`)) asked.push(new URL(r.url()).searchParams.get('variant')) })
  await page.goto('/tema/sage')
  await expect(page.locator('h1')).toHaveText('Taman Sage', { timeout: 30_000 })
  await expect(page.locator('.td-phone iframe')).toHaveAttribute('src', `/${SLUG}?variant=islam`)
  await page.getByRole('button', { name: 'Kristen' }).click()
  await expect(page.locator('.td-phone iframe')).toHaveAttribute('src', `/${SLUG}?variant=kristen`)
  await expect.poll(() => asked).toContain('kristen')
  await expect(page.locator('.td-info')).toHaveScreenshot('theme-detail-info.png', { timeout: 20_000 })
  await page.getByRole('link', { name: 'Pakai tema ini' }).click()
  await expect(page).toHaveURL(/\/register\?theme=sage$/)
  expect(await page.evaluate(() => sessionStorage.getItem('dearguest.theme'))).toBe('sage')
})
