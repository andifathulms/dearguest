// Personal data must not leave the browser in error reports: the same rules
// as the backend scrubber (apps/invitations/pii.py). Pure, for node tests.
export const MASK = '[disaring]'

const PATTERNS = [
  [/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[jwt]'],
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]'],
  [/(^|[^\d])(\+?62|0)8\d[\d\s.-]{6,13}\d/g, '$1[nomor]'],
  [/([?&](?:to|g|nama|name)=)[^&#\s"']*/gi, `$1${MASK}`],
]
const NOT_CODES = /^\/(api|dashboard|tema|og|share|static|assets|media|theme-previews|social)\//

export function scrubText(text) {
  if (typeof text !== 'string' || !text) return text
  let out = text
  for (const [re, sub] of PATTERNS) out = out.replace(re, sub)
  // /<slug>/<CODE>: the second path segment of an invitation link is a guest code.
  return out.replace(/(\/[a-z0-9][a-z0-9-]{1,99}\/)([A-Za-z0-9]{6,12})(?=[/?#"'\s]|$)/g,
    (all, lead) => (NOT_CODES.test(lead + '/x') ? all : `${lead}[kode]`))
}

export function scrubUrl(url) {
  return scrubText(url)
}

// Sentry beforeSend: keep the error type and stack (code locations), drop the
// message (it can quote what a guest typed), cookies, headers and the user.
export function scrubEvent(event) {
  delete event.user
  if (event.request) {
    delete event.request.cookies
    delete event.request.headers
    delete event.request.data
    if (event.request.url) event.request.url = scrubUrl(event.request.url)
    if (event.request.query_string) event.request.query_string = MASK
  }
  for (const ex of event.exception?.values || []) {
    if (ex.value) ex.value = MASK
  }
  if (event.message) event.message = MASK
  if (event.transaction) event.transaction = scrubUrl(event.transaction)
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter(Boolean)
  return event
}

// Navigation and request breadcrumbs keep their (scrubbed) URLs; console and
// UI breadcrumbs can carry anything, so their text goes.
export function scrubBreadcrumb(crumb) {
  if (!crumb) return crumb
  const out = { ...crumb, data: crumb.data ? { ...crumb.data } : undefined }
  if (out.data) {
    for (const k of ['from', 'to', 'url']) if (out.data[k]) out.data[k] = scrubUrl(out.data[k])
    for (const k of Object.keys(out.data)) if (!['from', 'to', 'url', 'method', 'status_code'].includes(k)) delete out.data[k]
  }
  if (out.message) out.message = MASK
  return out
}
