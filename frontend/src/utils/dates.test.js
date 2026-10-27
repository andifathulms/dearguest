// Run with a western-hemisphere zone: `npm run test:unit` sets TZ=America/Los_Angeles,
// where `new Date('2026-12-12')` is Friday 11 December, so a date-only parsing
// bug would show the wrong day here.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatDateOnly, formatEventDate, formatEventRange, formatEventTime, fromLocalInput, googleCalendarDates,
  localTimeNote, toLocalInputValue,
} from './dates.js'

test('the test really runs west of UTC', () => {
  assert.ok(new Date('2026-12-12T00:00:00Z').getTimezoneOffset() > 0, `TZ=${process.env.TZ}`)
  // The bug this guards against: date-only strings parse as UTC midnight.
  assert.equal(new Date('2026-12-12').getDate(), 11)
})

test('a date-only wedding date keeps its calendar day', () => {
  assert.equal(formatDateOnly('2026-12-12'), 'Sabtu, 12 Desember 2026')
  assert.equal(formatDateOnly('2021-03-01', { month: 'long', year: 'numeric' }), 'Maret 2021')
  assert.equal(formatDateOnly(''), '')
})

test('event times show in the event zone with its label', () => {
  const start = '2026-12-12T00:00:00Z' // 08:00 WITA, 07:00 WIB, 09:00 WIT
  assert.equal(formatEventTime(start, 'Asia/Makassar'), '08.00 WITA')
  assert.equal(formatEventTime(start, 'Asia/Jakarta'), '07.00 WIB')
  assert.equal(formatEventTime(start, 'Asia/Jayapura'), '09.00 WIT')
  assert.equal(formatEventDate(start, 'Asia/Makassar'), 'Sabtu, 12 Desember 2026')
})

test('time ranges', () => {
  assert.equal(formatEventRange('2026-12-12T01:00:00Z', '2026-12-12T03:00:00Z', 'Asia/Jakarta', 's.d. selesai'), '08.00 – 10.00 WIB')
  assert.equal(formatEventRange('2026-12-12T01:00:00Z', null, 'Asia/Jakarta', 's.d. selesai'), '08.00 WIB s.d. selesai')
})

test('a local-time line appears only when the guest is in another zone', () => {
  const start = '2026-12-12T00:00:00Z'
  assert.equal(localTimeNote(start, 'Asia/Makassar', 'Asia/Jakarta'), '07.00 WIB')
  assert.equal(localTimeNote(start, 'Asia/Makassar', 'Asia/Makassar'), null)
  assert.equal(localTimeNote(start, 'Asia/Jakarta', 'Asia/Jakarta'), null)
  assert.match(localTimeNote(start, 'Asia/Jakarta', 'America/Los_Angeles'), /^16\.00 /)
})

test('editor wall-clock times round-trip in the event zone', () => {
  assert.equal(fromLocalInput('2026-12-12T08:00', 'Asia/Makassar'), '2026-12-12T08:00:00+08:00')
  assert.equal(fromLocalInput('2026-12-12T08:00', 'Asia/Jakarta'), '2026-12-12T08:00:00+07:00')
  assert.equal(toLocalInputValue('2026-12-12T00:00:00Z', 'Asia/Makassar'), '2026-12-12T08:00')
})

test('google calendar dates are local to the event zone', () => {
  assert.equal(googleCalendarDates('2026-12-12T00:00:00Z', '2026-12-12T02:00:00Z', 'Asia/Makassar'), '20261212T080000/20261212T100000')
})
