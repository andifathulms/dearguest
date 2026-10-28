import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultTemplate, invitationVars, renderMessage, templateFor, unknownVariables } from './waTemplate.js'

const COPY = {
  'blast.salam': 'Dengan hormat,',
  'share.greeting': 'Halo',
  'blast.formal': '{salam}\n\nKepada Yth.\n{nama}\n{acara}: {tanggal}\n{link}\n{pasangan}',
  'blast.casual': '{greeting} {nama}! {link}',
  'events.type.akad': 'Akad Nikah',
}
// Same substitution rule as copy.js makeT: only the values passed are replaced.
const t = (key, values = {}) => Object.entries(values).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), COPY[key] ?? key)
const eventLabel = (e, tt) => e.title || tt(`events.type.${e.event_type}`)

test('defaults keep the per-guest variables for later', () => {
  assert.equal(defaultTemplate('casual', t), 'Halo {nama}! {link}')
  assert.ok(defaultTemplate('formal', t).startsWith('Dengan hormat,\n\nKepada Yth.\n{nama}'))
  assert.equal(templateFor('casual', { casual: 'Hai {nama}' }, t), 'Hai {nama}')
  assert.equal(templateFor('casual', { casual: '' }, t), 'Halo {nama}! {link}')
  assert.equal(templateFor('casual', null, t), 'Halo {nama}! {link}')
})

test('fills variables; unknown ones are left as typed and reported', () => {
  const vars = {
    nama: 'Bapak Ahmad', link: 'https://x.id/a/K7MPQ2',
    ...invitationVars({
      couple: { bride_name: 'Andini', groom_name: 'Bagus' },
      event: { event_type: 'akad', title: '', start: '2026-12-12T01:00:00Z', timezone: 'Asia/Jakarta' },
      t, eventLabel,
    }),
  }
  assert.equal(
    renderMessage(defaultTemplate('formal', t), vars),
    'Dengan hormat,\n\nKepada Yth.\nBapak Ahmad\nAkad Nikah: Sabtu, 12 Desember 2026, 08.00 WIB\nhttps://x.id/a/K7MPQ2\nAndini & Bagus',
  )
  assert.equal(renderMessage('Hai {nma}, {nama}', vars), 'Hai {nma}, Bapak Ahmad')
  assert.deepEqual(unknownVariables('Hai {nma} {nama} {Link} {nma} { spasi }'), ['nma', 'Link'])
  assert.deepEqual(unknownVariables(defaultTemplate('formal', t)), [])
})

test('the event zone is used, not the device zone', () => {
  const vars = invitationVars({
    couple: { bride_name: 'A', groom_name: 'B' },
    event: { event_type: 'akad', title: 'Mappacci', start: '2026-12-12T16:30:00Z', timezone: 'Asia/Jayapura' },
    t, eventLabel,
  })
  assert.deepEqual(vars, { pasangan: 'A & B', acara: 'Mappacci', tanggal: 'Minggu, 13 Desember 2026, 01.30 WIT' })
})
