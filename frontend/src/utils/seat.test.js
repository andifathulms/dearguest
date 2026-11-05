import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seatLabel, tableSummary } from './seat.js'

test('a bare number reads as a table', () => {
  assert.equal(seatLabel('12'), 'Meja 12')
  assert.equal(seatLabel(' 7b '), 'Meja 7b')
})

test('anything else is kept as typed', () => {
  assert.equal(seatLabel('VIP A'), 'VIP A')
  assert.equal(seatLabel('Meja 3'), 'Meja 3')
  assert.equal(seatLabel(''), '')
  assert.equal(seatLabel(null), '')
})

test('table summary in natural order, unseated counted apart', () => {
  const { tables, unseated } = tableSummary([
    { table: '10' }, { table: '2', checked_in: true, arrived_pax: 3 }, { table: '2' }, { table: 'VIP' }, { table: '' }, {},
  ])
  assert.deepEqual(tables.map(t => [t.label, t.guests, t.arrived, t.arrived_pax]),
    [['Meja 2', 2, 1, 3], ['Meja 10', 1, 0, 0], ['VIP', 1, 0, 0]])
  assert.equal(unseated, 2)
})
