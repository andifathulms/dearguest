import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActionButton, Badge, Card, Chips, Data, Empty, PageHead, Pager, Search, dateTime, staffPost, useStaff, useTitle,
} from '../ui.jsx'

const STATUSES = { pending: ['Ditahan', 'warn'], visible: ['Tampil', 'good'], hidden: ['Disembunyikan', 'muted'] }

export default function WishesPage() {
  useTitle('Ucapan')
  const [query, setQuery] = useState({ status: 'pending', q: '', page: 1 })
  const state = useStaff('wishes/', query)
  const set = patch => setQuery(q => ({ ...q, page: 1, ...patch }))
  return (
    <>
      <PageHead eyebrow="Moderasi" title="Ucapan"
        lead="Ucapan tamu di semua undangan. Pasangan memoderasi dinding mereka sendiri; staf turun tangan bila ada penyalahgunaan. Ditahan berarti menunggu persetujuan pasangan." />
      <div className="bo-toolbar">
        <Chips label="Status ucapan" value={query.status} onChange={status => set({ status })} options={[
          { value: 'pending', label: 'Ditahan' }, { value: 'visible', label: 'Tampil' },
          { value: 'hidden', label: 'Disembunyikan' }, { value: '', label: 'Semua' },
        ]} />
        <Search value={query.q} onChange={q => set({ q })} placeholder="Cari slug, nama tamu, isi ucapan" />
      </div>
      <Data state={state}>
        {d => (d.results.length ? (
          <div className="bo-stack">
            {d.results.map(w => (
              <Card key={w.id} className="bo-wish">
                <blockquote>{w.wishes}</blockquote>
                <div className="bo-wish-foot">
                  <span className="bo-quiet">
                    <b>{w.guest_name}</b> · <Link to={`/backoffice/undangan/${w.invitation_id}`} className="bo-slug">{w.slug}</Link> · {dateTime(w.submitted_at)}
                  </span>
                  <span className="bo-row">
                    <Badge tone={STATUSES[w.wish_status][1]}>{STATUSES[w.wish_status][0]}</Badge>
                    {w.wish_status !== 'hidden'
                      ? <ActionButton run={() => staffPost(`wishes/${w.id}/`, { wish_status: 'hidden' })} onDone={state.reload}
                          confirm="Sembunyikan ucapan ini dari halaman undangan?">Sembunyikan</ActionButton>
                      : <ActionButton run={() => staffPost(`wishes/${w.id}/`, { wish_status: 'visible' })} onDone={state.reload}>Tampilkan</ActionButton>}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : <Card><Empty>Tidak ada ucapan di sini.</Empty></Card>)}
      </Data>
      <Pager data={state.data} onPage={page => setQuery(q => ({ ...q, page }))} />
    </>
  )
}
