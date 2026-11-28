import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card, Chips, Data, Empty, PageHead, Pager, STATUS, Search, StatusBadge, TIER, date, num, useStaff, useTitle,
} from '../ui.jsx'

const ORDER = ['live', 'requested', 'draft', 'expired', 'purged']

export default function InvitationsPage() {
  useTitle('Undangan')
  const [query, setQuery] = useState({ status: '', q: '', page: 1 })
  const state = useStaff('invitations/', query)
  const set = patch => setQuery(q => ({ ...q, page: 1, ...patch }))
  const counts = state.data?.status_counts || {}
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <>
      <PageHead eyebrow="Pelanggan" title="Undangan"
        lead="Setiap undangan pasangan, tanpa undangan demo. Buka satu untuk melihat acaranya, aktivitasnya, dan tindakan staf." />
      <div className="bo-toolbar">
        <Chips label="Status" value={query.status} onChange={status => set({ status })} options={[
          { value: '', label: 'Semua', count: state.data ? total : null },
          ...ORDER.map(key => ({ value: key, label: STATUS[key].label, count: counts[key] ?? null })),
        ]} />
        <Search value={query.q} onChange={q => set({ q })} placeholder="Cari slug, nama, akun, email" />
      </div>
      <Card>
        <Data state={state}>
          {d => (d.results.length ? <InvitationTable rows={d.results} /> : <Empty>Tidak ada undangan yang cocok.</Empty>)}
        </Data>
      </Card>
      <Pager data={state.data} onPage={page => setQuery(q => ({ ...q, page }))} />
    </>
  )
}

function InvitationTable({ rows }) {
  return (
    <div className="bo-table-wrap">
      <table className="bo-table">
        <thead>
          <tr>
            <th>Undangan</th><th>Status</th><th>Tema · paket</th><th>Tanggal</th>
            <th className="num">Tamu</th><th className="num">Dibuka</th><th className="num">RSVP</th><th>Kelengkapan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>
                <Link to={`/backoffice/undangan/${r.id}`} className="bo-row-title">{r.names || r.slug}</Link>
                <span className="bo-quiet bo-block">{r.slug}{r.owner ? ` · ${r.owner}` : ''}</span>
              </td>
              <td><StatusBadge status={r.status} /></td>
              <td>{r.theme_name}<span className="bo-quiet bo-block">{TIER[r.tier]}</span></td>
              <td className="dg-num">{date(r.wedding_date)}</td>
              <td className="num dg-num">{num(r.guests)}</td>
              <td className="num dg-num">{num(r.opens)}</td>
              <td className="num dg-num">{num(r.rsvps)}</td>
              <td>
                <span className="bo-progress" aria-label={`${4 - r.missing.length} dari 4`}>
                  {[0, 1, 2, 3].map(i => <i key={i} className={i < 4 - r.missing.length ? 'on' : ''} />)}
                </span>
                {r.missing.length > 0 && <span className="bo-quiet bo-block">kurang: {r.missing.join(', ')}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
