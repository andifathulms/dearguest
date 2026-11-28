import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, Data, Empty, PageHead, Pager, Search, useStaff, useTitle, when } from '../ui.jsx'

const TONE = {
  activation_requested: 'warn', activated: 'good', account_deleted: 'bad', staff_action: 'ink',
}

// One line per event: when, what, which invitation. Shared with the overview
// and an invitation's page.
export function FeedList({ rows, time = when }) {
  if (!rows.length) {
    return <Empty>Belum ada aktivitas. Pendaftaran, undangan baru, permintaan aktivasi dan tindakan staf muncul di sini.</Empty>
  }
  return (
    <ol className="bo-feed">
      {rows.map(r => (
        <li key={r.id}>
          <time className="bo-quiet dg-num" dateTime={r.at}>{time(r.at)}</time>
          <Badge tone={TONE[r.kind] || 'muted'}>{r.kind_label}</Badge>
          <span className="bo-feed-text">
            {r.slug && <><Link to={`/backoffice/undangan/${r.invitation_id}`} className="bo-slug">{r.slug}</Link> · </>}
            {r.text}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function ActivityPage() {
  useTitle('Aktivitas')
  const [query, setQuery] = useState({ kind: '', slug: '', page: 1 })
  const state = useStaff('activity/', query)
  const set = patch => setQuery(q => ({ ...q, page: 1, ...patch }))
  return (
    <>
      <PageHead eyebrow="Hari ini" title="Aktivitas"
        lead="Semua yang terjadi di Vowvella, terbaru di atas. Hanya jenis kejadian dan undangan yang dicatat, tanpa nama atau nomor tamu. Disimpan 180 hari." />
      <div className="bo-toolbar">
        <select className="dg-input bo-select" aria-label="Jenis kejadian" value={query.kind}
          onChange={e => set({ kind: e.target.value })}>
          <option value="">Semua jenis</option>
          {state.data?.kinds.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
        </select>
        <Search value={query.slug} onChange={slug => set({ slug })} placeholder="Cari undangan (slug)" />
      </div>
      <Card>
        <Data state={state}>{d => <FeedList rows={d.results} />}</Data>
      </Card>
      <Pager data={state.data} onPage={page => setQuery(q => ({ ...q, page }))} />
    </>
  )
}
