// Hermetic API for the pack suites: every /api/** call is answered from
// fixtures and every photo from fixtures/images, so the suite needs no
// database and renders identically on any machine.
import fs from 'fs'

const fixture = name => new URL(`./fixtures/${name}`, import.meta.url)
const readJson = name => JSON.parse(fs.readFileSync(fixture(name), 'utf8'))

// API calls only: the path *starts* with /api/. (A '**/api/**' glob would also
// catch the dev server's own source module /src/api/client.js.)
const isApi = url => url.pathname.startsWith('/api/')

export const SLUG = 'demo-minimal'
// Fixed "now" for the countdown and "x hari yang lalu" on wishes.
export const NOW = new Date('2026-12-03T10:00:00+07:00')

async function servePhotos(page) {
  await page.route('http://fixtures.test/**', route => {
    const name = new URL(route.request().url()).pathname.slice(1)
    return route.fulfill({ path: fixture(`images/${name}`).pathname, contentType: 'image/jpeg' })
  })
}

// The public invitation, as guests see it.
export async function stubInvitation(page, overrides = {}) {
  const invitation = { ...readJson('invitation.json'), ...overrides }
  const wishes = readJson('wishes.json')
  await servePhotos(page)
  await page.route(isApi, route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith(`/invitations/${SLUG}/`)) return route.fulfill({ json: invitation })
    if (path.endsWith(`/invitations/${SLUG}/wishes/`)) return route.fulfill({ json: wishes })
    return route.fulfill({ status: 404, json: { detail: 'not stubbed' } })
  })
  return invitation
}

// A tiny stateful editor backend: PATCH updates what the next GET returns,
// so the editor's save → reload → live-preview loop runs for real.
export async function stubEditor(page) {
  const state = {
    ...readJson('invitation.json'),
    tier: 'premium', is_active: true, activation_requested: false, has_activation_code: false,
    music_preset: null,
  }
  await servePhotos(page)
  await page.route(isApi, async route => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    if (path.endsWith('/music-presets/')) return route.fulfill({ json: [] })
    if (path.endsWith(`/my/invitations/${SLUG}/`)) {
      if (req.method() === 'PATCH') {
        // The editor sends multipart FormData; pull out the fields it changed.
        const body = req.postDataBuffer()?.toString('utf8') || ''
        for (const field of ['theme', 'photo_filter']) {
          const m = body.match(new RegExp(`name="${field}"\\r\\n\\r\\n([^\\r]*)`))
          if (m) state[field] = m[1]
        }
      }
      return route.fulfill({ json: state })
    }
    if (path.endsWith(`/invitations/${SLUG}/wishes/`)) return route.fulfill({ json: readJson('wishes.json') })
    return route.fulfill({ status: 404, json: { detail: 'not stubbed' } })
  })
  return state
}

// Wait until fonts and every image currently in the DOM have loaded.
export async function settle(page, scope = 'body') {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(sel => [...document.querySelector(sel).querySelectorAll('img')]
    .filter(i => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight * 2)
    .every(i => i.complete), scope)
}
