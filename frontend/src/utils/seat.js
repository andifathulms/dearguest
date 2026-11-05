// A guest's table as people say it: a bare number becomes "Meja 12"; anything
// else ("VIP A", "Meja 3", "Keluarga 2") is shown as the couple typed it.
export function seatLabel(table) {
  const t = String(table ?? '').trim()
  return /^\d+[A-Za-z]?$/.test(t) ? `Meja ${t}` : t
}

// Per table: how many invitations sit there, how many are in, and how many
// people came. Tables in natural order ("2" before "10"); unseated guests
// counted apart.
export function tableSummary(guests) {
  const rows = new Map()
  let unseated = 0
  for (const g of guests) {
    const table = String(g.table || '').trim()
    if (!table) { unseated += 1; continue }
    const row = rows.get(table) || { table, label: seatLabel(table), guests: 0, arrived: 0, arrived_pax: 0 }
    row.guests += 1
    if (g.checked_in) { row.arrived += 1; row.arrived_pax += g.arrived_pax || 0 }
    rows.set(table, row)
  }
  const tables = [...rows.values()].sort((a, b) => a.table.localeCompare(b.table, 'id', { numeric: true }))
  return { tables, unseated }
}
