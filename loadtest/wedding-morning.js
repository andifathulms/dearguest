// Wedding morning on one invitation (k6), against the prod-like stack:
//  - morning: 500 guests open the invitation within 60 minutes (rising toward
//    the akad), 70 % from personal links; each loads the page, the payload,
//    their name, sends the open beacon, the hero photo, then polls the
//    wishes wall every 30 s for two minutes;
//  - spike: 50 guests at once for 2 minutes (everyone opens the link the
//    family group just shared);
//  - rsvp: 150 answers in 10 minutes;
//  - crawlers: WhatsApp fetching link previews right after a blast.
// SCALE compresses time (SCALE=6: the hour becomes 10 minutes, the same 500
// guests). Run with loadtest/run.sh.
import http from 'k6/http'
import { check, sleep } from 'k6'
import { SharedArray } from 'k6/data'

const BASE = __ENV.BASE || 'https://nginx'
const SCALE = Number(__ENV.SCALE || 1)
const data = JSON.parse(open('/data/codes.json'))
const SLUG = data.slug
const codes = new SharedArray('codes', () => data.codes)
const minutes = m => `${Math.max(1, Math.round((m / SCALE) * 60))}s`

export const options = {
  insecureSkipTLSVerify: true,
  discardResponseBodies: false,
  scenarios: {
    morning: {
      executor: 'ramping-arrival-rate', exec: 'guest', timeUnit: '1m',
      startRate: 0, preAllocatedVUs: 60, maxVUs: 250,
      // 0 -> 10/min over the first half hour, 10 -> 12.6/min over the second: ~500 guests.
      stages: [{ target: Math.round(10 * SCALE), duration: minutes(30) }, { target: Math.round(12.6 * SCALE), duration: minutes(30) }],
    },
    spike: { executor: 'constant-vus', exec: 'guest', vus: 50, duration: '2m', startTime: minutes(40) },
    rsvp: { executor: 'constant-arrival-rate', exec: 'rsvp', rate: Math.round(15 * SCALE), timeUnit: '1m',
             duration: minutes(10), startTime: minutes(45), preAllocatedVUs: 20 },
    crawlers: { executor: 'constant-arrival-rate', exec: 'crawler', rate: 120, timeUnit: '1m',
                duration: '1m', startTime: minutes(20), preAllocatedVUs: 10 },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{kind:page}': ['p(95)<500'],
    'http_req_duration{kind:api}': ['p(95)<800'],
    'http_req_duration{kind:rsvp}': ['p(95)<1500'],
    'http_req_duration{kind:og}': ['p(95)<1500'],
  },
}

const ip = () => `10.${(Math.random() * 250) | 0}.${(Math.random() * 250) | 0}.${1 + ((Math.random() * 250) | 0)}`
const req = (address, kind, extra = {}) => ({ headers: { Host: 'localhost', 'X-Loadtest-IP': address, ...extra }, tags: { kind } })

export function guest() {
  const address = ip()
  const code = Math.random() < 0.7 ? codes[(Math.random() * codes.length) | 0] : null
  const page = http.get(`${BASE}/${SLUG}${code ? '/' + code : ''}`, req(address, 'page'))
  check(page, { 'page 200': r => r.status === 200 })
  const script = (page.body || '').match(/\/assets\/index-[\w-]+\.js/)
  if (script) http.get(`${BASE}${script[0]}`, req(address, 'static'))
  const inv = http.get(`${BASE}/api/invitations/${SLUG}/`, req(address, 'api'))
  check(inv, { 'invitation 200': r => r.status === 200 })
  if (code) {
    check(http.get(`${BASE}/api/invitations/${SLUG}/guest/${code}/`, req(address, 'api')), { 'guest 200': r => r.status === 200 })
    http.post(`${BASE}/api/invitations/${SLUG}/guest/${code}/open/`, null, req(address, 'api'))
  }
  const hero = inv.status === 200 ? inv.json('hero_photo') : null
  if (hero) http.get(hero.replace(/^https?:\/\/[^/]+/, BASE), req(address, 'media'))
  for (let i = 0; i < 4; i++) {
    sleep(30 / SCALE)
    check(http.get(`${BASE}/api/invitations/${SLUG}/wishes/`, req(address, 'api')), { 'wishes 200': r => r.status === 200 })
  }
}

export function rsvp() {
  const address = ip()
  const code = codes[(Math.random() * codes.length) | 0]
  const res = http.post(`${BASE}/api/invitations/${SLUG}/rsvp/`, JSON.stringify({
    guest_name: 'Tamu Uji', guest_code: code, attending: Math.random() < 0.8, pax: 1 + ((Math.random() * 2) | 0),
    wishes: Math.random() < 0.6 ? 'Selamat menempuh hidup baru, semoga sakinah mawaddah warahmah.' : '',
  }), req(address, 'rsvp', { 'Content-Type': 'application/json' }))
  check(res, { 'rsvp saved': r => r.status === 201 || r.status === 200 })
}

export function crawler() {
  const address = ip()
  const code = codes[(Math.random() * codes.length) | 0]
  const page = http.get(`${BASE}/${SLUG}/${code}`, req(address, 'og', { 'User-Agent': 'WhatsApp/2.23.20.0 A' }))
  check(page, { 'og page 200': r => r.status === 200 })
  const image = (page.body || '').match(/og:image" content="([^"]+)"/)
  if (image) check(http.get(image[1].replace(/^https?:\/\/[^/]+/, BASE), req(address, 'og', { 'User-Agent': 'WhatsApp/2.23.20.0 A' })),
    { 'og image 200': r => r.status === 200 })
}
