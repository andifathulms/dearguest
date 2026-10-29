// Marketing funnel (backend funnel.py): one anonymous "visit" per browser
// session, and the visit's UTM tags sent along with register and invitation
// create. sessionStorage only, so nothing outlives the tab session; storage
// failures (private mode) just mean the step goes uncounted.
import api from '../api/client.js'

const UTM_KEY = 'dearguest.utm'
const VISIT_KEY = 'dearguest.visit'
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign']

function read(key) {
  try { return sessionStorage.getItem(key) } catch { return null }
}
function write(key, value) {
  try { sessionStorage.setItem(key, value) } catch { /* private mode */ }
}

// Call on marketing pages (landing, /tema, /tema/:id).
export function trackVisit() {
  const params = new URLSearchParams(window.location.search)
  const utm = Object.fromEntries(FIELDS.filter(f => params.get(f)).map(f => [f, params.get(f).slice(0, 100)]))
  if (Object.keys(utm).length) write(UTM_KEY, JSON.stringify(utm))
  if (read(VISIT_KEY)) return
  write(VISIT_KEY, '1')
  api.post('/funnel/visit/', { utm: storedUtm() }).catch(() => {})
}

export function storedUtm() {
  try { return JSON.parse(read(UTM_KEY) || '{}') } catch { return {} }
}
