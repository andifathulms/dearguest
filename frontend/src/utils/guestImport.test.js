import test from 'node:test'
import assert from 'node:assert/strict'
import { SKIP, guessColumns, parseTable, previewRows } from './guestImport.js'

test('parses an Excel paste (tabs) with a header and CRLF', () => {
  const rows = parseTable('Nama\tNo HP\tGrup\r\nBudi Santoso\t0812 3456 7890\tKantor\r\n\r\nSiti\t+62 812-3456-7891\t\r\n')
  assert.deepEqual(rows, [['Nama', 'No HP', 'Grup'], ['Budi Santoso', '0812 3456 7890', 'Kantor'], ['Siti', '+62 812-3456-7891', '']])
  const guess = guessColumns(rows)
  assert.equal(guess.hasHeader, true)
  assert.deepEqual(guess.mapping, { name: 0, whatsapp: 1, group: 2, max_pax: -1 })
})

test('parses quoted CSV with commas, quotes and a BOM', () => {
  const rows = parseTable('﻿name,whatsapp,jumlah\n"Keluarga Bpk. Joko, S.H.",081234567892,2\n"Ani ""Ndut""",,1\n')
  assert.deepEqual(rows[1], ['Keluarga Bpk. Joko, S.H.', '081234567892', '2'])
  assert.deepEqual(rows[2], ['Ani "Ndut"', '', '1'])
  assert.deepEqual(guessColumns(rows).mapping, { name: 0, whatsapp: 1, group: -1, max_pax: 2 })
})

test('semicolon CSV (Excel in Indonesian locale)', () => {
  assert.deepEqual(parseTable('Nama;WA\nBudi;0812345678'), [['Nama', 'WA'], ['Budi', '0812345678']])
})

test('without a header, the phone column is found by its content', () => {
  const rows = parseTable('0812 3456 7890\tBudi\n0812 3456 7891\tSiti\n')
  assert.deepEqual(guessColumns(rows), { mapping: { name: 1, whatsapp: 0, group: -1, max_pax: -1 }, hasHeader: false })
})

test('preview flags the same rows the server skips', () => {
  const rows = parseTable([
    'Nama\tWA\tJumlah',
    '  Budi   Santoso \t+62 812-3456-7890\t2',
    'Rina\t12\t',
    'Budi Kedua\t6281234567890\t',
    'budi santoso\t\t',
    'Lama\t081200000001\t',
    '\t0812999999\t',
    'Tanpa Nomor\t\tbanyak',
  ].join('\n'))
  const out = previewRows(rows, guessColumns(rows), [{ name: 'Sudah Ada', whatsapp: '6281200000001' }])
  assert.deepEqual(out.map(r => r.skip), [null, SKIP.badNumber, SKIP.dupNumber, SKIP.dupName, SKIP.dupNumber, SKIP.blank, null])
  assert.deepEqual(out[0], { row: 1, name: 'Budi Santoso', whatsapp: '+62 812-3456-7890', number: '6281234567890', group: '', max_pax: 2, skip: null })
  assert.equal(out[6].max_pax, null)
})
