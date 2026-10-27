// Hermetic API for the pack suites: every /api/** call is answered from
// fixtures and every photo from fixtures/images, so the suite needs no
// database and renders identically on any machine.
import fs from 'fs'
import { expect } from '@playwright/test'

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

// Google Maps embeds load only after "Lihat Peta"; answer them with a plain
// grey page so the suite stays hermetic.
async function stubMaps(page) {
  await page.route(/^https:\/\/www\.google\.com\/maps/, route =>
    route.fulfill({ contentType: 'text/html', body: '<body style="margin:0;background:#d9d6cf"></body>' }))
}

// The public invitation, as guests see it. `rsvp` is the answer to POST
// …/rsvp/ (default: a first answer); `guests` maps personal-link codes to
// {name, max_pax}.
export async function stubInvitation(page, overrides = {}, { rsvp, guests = {} } = {}) {
  const invitation = { ...readJson('invitation.json'), ...overrides }
  const wishes = readJson('wishes.json')
  await servePhotos(page)
  await stubMaps(page)
  await page.route(isApi, route => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    if (path.endsWith(`/invitations/${SLUG}/`)) return route.fulfill({ json: invitation })
    if (path.endsWith(`/invitations/${SLUG}/wishes/`)) return route.fulfill({ json: wishes })
    if (path.endsWith(`/invitations/${SLUG}/rsvp/`) && req.method() === 'POST') {
      const answer = rsvp || { status: 201, json: { updated: false, wish_status: 'visible' } }
      return route.fulfill(answer)
    }
    const guest = path.match(new RegExp(`/invitations/${SLUG}/guest/([^/]+)/$`))
    if (guest && guests[guest[1]]) return route.fulfill({ json: guests[guest[1]] })
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

// Wait until a section and every Framer-animated child in it (inline
// opacity: section cards reveal on their own in-view) is fully shown.
// WebKit sometimes skips the intersection check after an instant programmatic
// scroll, so each poll brings the first still-hidden part into view and
// scrolls with real wheel events, as a person would (a 2px nudge was not
// always enough to make WebKit re-check).
export async function waitRevealed(page, wrap) {
  await wrap.evaluate(el => el.scrollIntoView({ block: 'center' }))
  await expect.poll(async () => {
    const pending = await wrap.evaluate(el => {
      const parts = [el, ...el.querySelectorAll('[style*="opacity"]')]
      const hidden = parts.find(n => Number(getComputedStyle(n).opacity) < 1)
      if (hidden && hidden !== el) hidden.scrollIntoView({ block: 'center' })
      // On failure the message names what stayed hidden.
      return hidden ? `${hidden.tagName}.${hidden.className} opacity ${getComputedStyle(hidden).opacity}` : 0
    })
    // From the corner, so the wheel scrolls the page, not a scrollable list under the pointer.
    await page.mouse.move(0, 0)
    await page.mouse.wheel(0, 60)
    await page.mouse.wheel(0, -60)
    return pending
  }, { timeout: 15_000, intervals: [250] }).toBe(0)
  await wrap.evaluate(el => el.scrollIntoView({ block: 'center' }))
}
