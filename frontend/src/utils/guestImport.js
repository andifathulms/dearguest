// Guest list import: parse a paste from Excel/Sheets (tab-separated) or a CSV
// file, guess which column is which, and preview what will be saved. The
// server (backend guest_import.py) applies the same rules again and is the
// authority; this is so the couple sees problems before saving.
import { normaliseWhatsapp } from './whatsapp.js'

export const MAX_ROWS = 1000
export const MAX_PAX = 10
export const FIELDS = [
  { key: 'name', label: 'Nama' },
  { key: 'whatsapp', label: 'No. WhatsApp' },
  { key: 'group', label: 'Grup' },
  { key: 'max_pax', label: 'Jumlah orang' },
]
export const SKIP = {
  blank: 'Nama kosong',
  badNumber: 'Nomor WhatsApp tidak valid',
  dupNumber: 'Nomor sudah ada',
  dupName: 'Nama sudah ada',
}

const HEADER_WORDS = {
  name: /^(nama|name|tamu|guest|nama tamu|nama lengkap)$/,
  whatsapp: /^(wa|whatsapp|no\.? ?wa|no\.? ?hp|hp|nomor|nomor wa|nomor hp|no\.? ?telp|telepon|phone|no)$/,
  group: /^(grup|group|kelompok|kategori|keterangan)$/,
  max_pax: /^(jumlah|pax|jumlah orang|orang|jml)$/,
}

function delimiter(text) {
  const sample = text.split(/\r?\n/).slice(0, 5).join('\n')
  if (sample.includes('\t')) return '\t'
  return (sample.match(/;/g) || []).length > (sample.match(/,/g) || []).length ? ';' : ','
}

// RFC 4180-ish: quoted fields, doubled quotes, CRLF or LF, delimiter auto-detected.
export function parseTable(text) {
  const src = String(text || '').replace(/^﻿/, '')
  const sep = delimiter(src)
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++ } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"' && field === '') quoted = true
    else if (c === sep) { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.map(r => r.map(f => f.trim())).filter(r => r.some(Boolean))
}

const looksLikeNumber = v => /^[+\d][\d\s().-]{6,}$/.test(v) && normaliseWhatsapp(v) !== ''

// { mapping: {name: col, whatsapp: col|-1, ...}, hasHeader }
export function guessColumns(rows) {
  const first = rows[0] || []
  const mapping = { name: -1, whatsapp: -1, group: -1, max_pax: -1 }
  first.forEach((cell, col) => {
    const word = cell.toLowerCase().replace(/[:*]/g, '').trim()
    for (const [key, re] of Object.entries(HEADER_WORDS)) if (mapping[key] === -1 && re.test(word)) { mapping[key] = col; break }
  })
  const hasHeader = mapping.name !== -1 || mapping.whatsapp !== -1
  if (!hasHeader) {
    // No header: the column that is mostly phone numbers is WhatsApp; the first other one is the name.
    const body = rows.slice(0, 20)
    const width = Math.max(0, ...body.map(r => r.length))
    for (let col = 0; col < width; col++) {
      const values = body.map(r => r[col] || '').filter(Boolean)
      if (mapping.whatsapp === -1 && values.length && values.filter(looksLikeNumber).length / values.length >= 0.6) mapping.whatsapp = col
      else if (mapping.name === -1 && values.length) mapping.name = col
    }
  }
  return { mapping, hasHeader }
}

const clean = (v, limit) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, limit)

function pax(v) {
  const n = Number(String(v ?? '').trim())
  return Number.isInteger(n) && n >= 1 && n <= MAX_PAX ? n : null
}

// Each row with what will happen to it: { row, name, whatsapp, number, group, max_pax, skip }.
export function previewRows(rows, { mapping, hasHeader }, existing = []) {
  const numbers = new Set(existing.map(g => normaliseWhatsapp(g.whatsapp)).filter(Boolean))
  const names = new Set(existing.map(g => g.name.toLocaleLowerCase('id')))
  const pick = (r, key) => (mapping[key] >= 0 ? r[mapping[key]] : '')
  return rows.slice(hasHeader ? 1 : 0).map((r, i) => {
    const name = clean(pick(r, 'name'), 200)
    const whatsapp = clean(pick(r, 'whatsapp'), 40)
    const number = normaliseWhatsapp(whatsapp)
    let skip = null
    if (!name) skip = SKIP.blank
    else if (whatsapp && !number) skip = SKIP.badNumber
    else if (number && numbers.has(number)) skip = SKIP.dupNumber
    else if (names.has(name.toLocaleLowerCase('id'))) skip = SKIP.dupName
    if (!skip) {
      names.add(name.toLocaleLowerCase('id'))
      if (number) numbers.add(number)
    }
    return { row: i + 1, name, whatsapp, number, group: clean(pick(r, 'group'), 100), max_pax: pax(pick(r, 'max_pax')), skip }
  })
}
