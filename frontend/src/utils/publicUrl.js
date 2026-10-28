// Every link a person will share, paste or scan (WhatsApp messages, copied
// links, QR codes) is built here, on the canonical public origin.
//
// VITE_PUBLIC_ORIGIN is required for production builds (vite.config.js fails
// the build without it), so a relative link can never reach a guest. In dev it
// falls back to the page's own origin.
const PUBLIC_ORIGIN = (import.meta.env.VITE_PUBLIC_ORIGIN || (import.meta.env.DEV ? window.location.origin : ''))
  .replace(/\/+$/, '')

export const publicOrigin = PUBLIC_ORIGIN

export const publicUrl = path => `${PUBLIC_ORIGIN}${path}`

// The invitation itself, e.g. for QR codes and "copy link".
export const invitationUrl = (slug, qs = '') => publicUrl(`/${slug}${qs}`)

// A guest's personal link: the name comes from the couple's guest list, and
// crawlers get a personalised preview. Used for "copy link", QR and WhatsApp.
export const guestUrl = (slug, code) => publicUrl(`/${slug}/${code}`)

// The /share page: same invitation, but with server-rendered Open Graph tags
// so WhatsApp shows a rich preview. qs may include ?to=&g= for personalization.
export const shareUrl = (slug, qs = '') => publicUrl(`/share/${slug}${qs}`)
