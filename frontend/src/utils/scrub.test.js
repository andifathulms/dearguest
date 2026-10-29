import test from 'node:test'
import assert from 'node:assert/strict'
import { MASK, scrubEvent, scrubText } from './scrub.js'

test('masks numbers, emails, tokens, ?to= and guest codes', () => {
  const out = scrubText('https://dearguest.id/andini-bagus/K7MPQ2?to=Budi%20Santoso 0812-3456-7890 budi@example.com eyJa.eyJb.c')
  for (const secret of ['K7MPQ2', 'Budi%20Santoso', '3456-7890', 'budi@example.com', 'eyJa.eyJb.c']) assert.ok(!out.includes(secret), secret)
  assert.ok(out.includes('/andini-bagus/[kode]'))
  assert.equal(scrubText('/api/invitations/andini-bagus/rsvps/'), '/api/invitations/andini-bagus/rsvps/')
  assert.equal(scrubText('/tema/javanese'), '/tema/javanese')
})

test('events keep the type and stack, lose messages, cookies and the user', () => {
  const event = scrubEvent({
    user: { id: 1 },
    request: { url: 'https://x.id/a-b/K7MPQ2?to=Budi', cookies: 'dg_access=x', headers: { Cookie: 'x' } },
    exception: { values: [{ type: 'TypeError', value: 'Budi Santoso, Jl. Mawar 3', stacktrace: { frames: [{ filename: 'app.js' }] } }] },
    breadcrumbs: [{ category: 'console', message: 'Budi Santoso' }, { category: 'navigation', data: { from: '/a-b/K7MPQ2', to: '/tema' } }],
  })
  assert.equal(event.user, undefined)
  assert.equal(event.request.cookies, undefined)
  assert.equal(event.request.url, `https://x.id/a-b/[kode]?to=${MASK}`)
  assert.equal(event.exception.values[0].value, MASK)
  assert.equal(event.exception.values[0].type, 'TypeError')
  assert.equal(event.breadcrumbs[0].message, MASK)
  assert.equal(event.breadcrumbs[1].data.from, '/a-b/[kode]')
  assert.ok(!JSON.stringify(event).includes('Budi'))
})
