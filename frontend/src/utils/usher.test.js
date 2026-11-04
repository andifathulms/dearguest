import { test } from 'node:test'
import assert from 'node:assert/strict'
import { codeFromScan, expectedPax, matchesGuest } from './usher.js'

test('a scanned personal link gives its code', () => {
  assert.equal(codeFromScan('https://dearguest.id/rani-dimas/K7MPQ2'), 'K7MPQ2')
  assert.equal(codeFromScan('https://dearguest.id/rani-dimas/K7MPQ2/'), 'K7MPQ2')
  assert.equal(codeFromScan('https://dearguest.id/rani-dimas?to=Budi&g=a1b2c3d4'), 'a1b2c3d4')
  assert.equal(codeFromScan(' K7MPQ2 '), 'K7MPQ2')
})

test('anything else is not a code', () => {
  assert.equal(codeFromScan('https://dearguest.id/rani-dimas'), '')
  assert.equal(codeFromScan('WIFI:S:Gedung;T:WPA;P:secret;;'), '')
  assert.equal(codeFromScan(''), '')
})

test('name search ignores accents, case and word order', () => {
  const g = { name: 'Ibu Sri Lestari', group: 'Keluarga', envelope_no: '017' }
  assert.ok(matchesGuest(g, 'sri  ibu'))
  assert.ok(matchesGuest({ name: 'André' }, 'andre'))
  assert.ok(matchesGuest(g, '017'))
  assert.ok(!matchesGuest(g, 'sri budi'))
})

test('check-in pre-fills the RSVP count, else the invitation limit', () => {
  assert.equal(expectedPax({ rsvp: { attending: true, pax: 3 }, max_pax: 4 }), 3)
  assert.equal(expectedPax({ rsvp: { attending: false, pax: 1 }, max_pax: 2 }), 2)
  assert.equal(expectedPax({ rsvp: null, max_pax: null }), 1)
})
