// The browser's voucher maths must match the server's (tests/test_vouchers.py).
import test from 'node:test'
import assert from 'node:assert/strict'
import { appliesTo, normaliseCode, priceWith, voucherDiscount, voucherLabel, voucherShort } from './vouchers.js'

const pct = { discount_type: 'percent', discount_percent: 20, max_discount: 15000, plans: [] }
const flat = { discount_type: 'amount', discount_amount: 25000, plans: ['bisnis'] }

test('codes are normalised like the server does', () => {
  assert.equal(normaliseCode('  hemat 20! '), 'HEMAT20')
  assert.equal(normaliseCode('vv-7kq2mx'), 'VV-7KQ2MX')
})

test('percent with a cap, nominal never below zero', () => {
  assert.equal(voucherDiscount(pct, 50000), 10000)
  assert.equal(voucherDiscount(pct, 99000), 15000)
  assert.equal(voucherDiscount(flat, 99000), 25000)
  assert.equal(voucherDiscount(flat, 20000), 20000)
  assert.equal(voucherDiscount(flat, 0), 0)
  assert.equal(voucherDiscount(null, 99000), 0)
})

test('plans', () => {
  assert.ok(appliesTo(pct, 'premium') && appliesTo(pct, 'bisnis'))
  assert.ok(!appliesTo(flat, 'premium'))
  assert.equal(priceWith(flat, 'premium', 99000), 99000)
  assert.equal(priceWith(flat, 'bisnis', 179000), 154000)
})

test('labels', () => {
  assert.equal(voucherLabel(pct), '20% (maks. Rp15.000)')
  assert.equal(voucherLabel(pct, { cap: false }), '20%')
  assert.equal(voucherLabel(flat), 'Rp25.000')
  assert.equal(voucherShort(flat), 'Rp25rb')
  assert.equal(voucherShort({ discount_type: 'amount', discount_amount: 12500 }), 'Rp12,5rb')
  assert.equal(voucherShort(pct), '20%')
})
