import { useEffect, useState } from 'react'
import api from '../api/client.js'
import { eventLabel, makeT } from '../copy/copy.js'
import { formatEventDate, formatEventTime } from '../utils/dates.js'

const t = makeT()

function label(e) {
  return `${eventLabel(e, t)} · ${formatEventDate(e.start, e.timezone)}, ${formatEventTime(e.start, e.timezone)}`
}

// Plain text for the caterer / WO, pasted into WhatsApp.
function summaryText(data) {
  const line = (name, r) =>
    `${name}\n  Hadir: ${r.attending_pax} orang · Belum menjawab: ${r.awaiting} undangan (maks. ${r.awaiting_pax} orang)\n  Perkiraan maksimal: ${r.estimate_max} orang`
  const parts = ['Rekap tamu', '', ...data.events.map(e => line(label(e), e))]
  if (data.groups.length > 1) parts.push('', 'Per grup', ...data.groups.map(g => line(g.name || 'Tanpa grup', g)))
  parts.push('', line('Total', data.total))
  return parts.join('\n')
}

function Rows({ rows, name }) {
  return rows.map(r => (
    <tr key={name(r)}>
      <td className="dr-name">{name(r)}</td>
      <td className="dg-num">{r.invited}</td>
      <td className="dg-num"><strong>{r.attending_pax}</strong>{r.general_pax > 0 && <small className="hc-sub">+{r.general_pax} link umum</small>}</td>
      <td className="dg-num">{r.declined}</td>
      <td className="dg-num">{r.awaiting} <small className="hc-sub">maks. {r.awaiting_pax} org</small></td>
      <td className="dg-num hc-est">{r.estimate_max}</td>
    </tr>
  ))
}

function Table({ title, rows, name, first }) {
  return (
    <div className="dr-table-wrap hc-table">
      <table className="dr-table">
        <caption>{title}</caption>
        <thead>
          <tr><th>{first}</th><th>Diundang</th><th>Hadir (orang)</th><th>Tidak hadir</th><th>Belum menjawab</th><th>Perkiraan maks.</th></tr>
        </thead>
        <tbody><Rows rows={rows} name={name} /></tbody>
      </table>
    </div>
  )
}

// "Rekap untuk katering": the number that sets the catering bill, per event
// (or session) and per guest group. The server does the counting (headcount.py).
export default function Headcount({ slug }) {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get(`/invitations/${slug}/headcount/`).then(res => setData(res.data)).catch(() => {})
  }, [slug])

  if (!data || data.total.invited + data.total.attending_pax === 0) return null

  function copy() {
    navigator.clipboard.writeText(summaryText(data)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <section className="hc" aria-labelledby="hc-title">
      <div className="hc-head">
        <div>
          <h2 id="hc-title">Rekap untuk katering</h2>
          <p>Perkiraan maksimal = yang sudah konfirmasi hadir + batas orang dari undangan yang belum dijawab.</p>
        </div>
        <div className="hc-actions">
          <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={copy}>{copied ? 'Tersalin ✓' : 'Salin rekap'}</button>
          <button type="button" className="dg-btn dg-btn-line dg-btn-sm" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            {open ? 'Tutup rincian' : 'Lihat rincian'}
          </button>
        </div>
      </div>
      <p className="hc-total">
        <strong className="dg-num">{data.total.estimate_max}</strong> orang paling banyak
        <span> · {data.total.attending_pax} sudah pasti hadir · {data.total.awaiting} undangan belum menjawab</span>
      </p>
      {open && (
        <>
          {data.events.length > 0 && <Table title="Per acara / sesi" first="Acara" rows={data.events} name={label} />}
          {data.groups.length > 1 && <Table title="Per grup tamu" first="Grup" rows={data.groups} name={g => g.name || 'Tanpa grup'} />}
        </>
      )}
    </section>
  )
}
