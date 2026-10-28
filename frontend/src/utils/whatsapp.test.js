import test from 'node:test'
import assert from 'node:assert/strict'
import { normaliseWhatsapp, waLink } from './whatsapp.js'

// Same table as backend tests/test_blast.py NormaliserCases.
const CASES = {
  '0812-3456-7890': '6281234567890',
  '+62 812 3456 7890': '6281234567890',
  '6281234567890': '6281234567890',
  '81234567890': '6281234567890',
  '(0812) 3456 789': '628123456789',
  '': '',
  '12': '',
  'abc': '',
  '+1 415 555 0100': '14155550100',
  ['0'.repeat(20)]: '',
}

test('matches the backend normaliser', () => {
  for (const [raw, expected] of Object.entries(CASES)) assert.equal(normaliseWhatsapp(raw), expected, raw)
  assert.equal(normaliseWhatsapp(null), '')
  assert.equal(normaliseWhatsapp(81234567890), '6281234567890')
})

test('wa.me link encodes the message', () => {
  assert.equal(waLink('0812 3456 7890', 'Halo & selamat\nya'), 'https://wa.me/6281234567890?text=Halo%20%26%20selamat%0Aya')
  assert.equal(waLink('', 'x'), 'https://wa.me/?text=x')
})
