// Mode Penerima Tamu helpers. Pure, so they run under `node --test`.
import { seatLabel } from './seat.js'

// What an usher's camera read -> a guest code. Guests show the QR of their
// personal link (https://…/<slug>/<CODE>, older links …?g=<code>); a code
// typed or printed on its own also works.
export function codeFromScan(text) {
  const raw = String(text || '').trim()
  try {
    const url = new URL(raw)
    const legacy = url.searchParams.get('g')
    if (legacy) return legacy.trim()
    const parts = url.pathname.split('/').filter(Boolean)
    return parts.length >= 2 ? decodeURIComponent(parts[parts.length - 1]) : ''
  } catch {
    return /^[A-Za-z0-9]{4,12}$/.test(raw) ? raw : ''
  }
}

// Search the way ushers type names: no accents, case or extra spaces, and
// every word must appear ("bu sri" finds "Ibu Sri Lestari").
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export function matchesGuest(guest, query) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  const hay = fold(`${guest.name} ${guest.group || ''} ${seatLabel(guest.table)} ${guest.envelope_no || ''}`)
  return words.every(w => hay.includes(w))
}

// How many people to pre-fill at check-in: their RSVP, else their invitation's limit.
export const expectedPax = guest =>
  (guest.rsvp?.attending ? guest.rsvp.pax : null) || guest.max_pax || 1
