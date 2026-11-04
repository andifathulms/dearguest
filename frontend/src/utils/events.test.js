// Same cases as backend tests/test_audience.py: who sees which event.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eventsFor, primaryEvent, seesEvent } from './events.js'

const events = [
  { id: 1, is_primary: true, groups: ['Keluarga'] },
  { id: 2, groups: ['keluarga', 'Kantor'] },
  { id: 3, groups: ['Teman'] },
  { id: 4, groups: [] },
]

test('a guest sees their groups and the events for everyone', () => {
  assert.deepEqual(eventsFor(events, ' KELUARGA ').map(e => e.id), [1, 2, 4])
  assert.deepEqual(eventsFor(events, 'kantor').map(e => e.id), [2, 4])
  assert.deepEqual(eventsFor(events, '').map(e => e.id), [4])
})

test('a general link sees only the events for everyone', () => {
  assert.deepEqual(eventsFor(events, null).map(e => e.id), [4])
  assert.equal(seesEvent({ id: 5 }, null), true)   // older data without groups
})

test('the countdown falls back to the first visible event', () => {
  assert.equal(primaryEvent(eventsFor(events, 'Kantor')).id, 2)
})
