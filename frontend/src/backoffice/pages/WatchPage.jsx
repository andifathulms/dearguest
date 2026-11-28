import { Link } from 'react-router-dom'
import { Badge, Card, Data, Empty, PageHead, date, num, useStaff, useTitle } from '../ui.jsx'

// Upcoming weddings and what isn't ready. `compact` drops the check-in column
// for the overview.
export function WatchList({ rows, compact = false }) {
  return (
    <ul className="bo-watch">
      {rows.map(w => (
        <li key={w.id} className={w.flags.some(f => f.tone === 'bad') ? 'bad' : ''}>
          <div className="bo-watch-day">
            <b>{date(w.wedding_date, { weekday: 'short', day: 'numeric', month: 'short' })}</b>
            <span>{w.days_left === 0 ? 'hari ini' : `${w.days_left} hari lagi`}</span>
          </div>
          <div className="bo-watch-who">
            <Link to={`/backoffice/undangan/${w.id}`} className="bo-watch-names">{w.names || w.slug}</Link>
            <span className="bo-quiet">{w.slug}</span>
          </div>
          <dl className="bo-watch-nums">
            <div><dt>Tamu</dt><dd className="dg-num">{num(w.guests)}</dd></div>
            <div><dt>Dikirim</dt><dd className="dg-num">{num(w.sent)}</dd></div>
            <div><dt>RSVP</dt><dd className="dg-num">{num(w.rsvps)}</dd></div>
            <div><dt>Hadir</dt><dd className="dg-num">{num(w.pax)}</dd></div>
            {!compact && <div><dt>Check-in</dt><dd className="dg-num">{w.checked_in == null ? '—' : num(w.checked_in)}</dd></div>}
          </dl>
          <div className="bo-badges">
            {w.flags.length ? w.flags.map(f => <Badge key={f.text} tone={f.tone}>{f.text}</Badge>) : <Badge tone="good">siap</Badge>}
            {w.usher && <Badge>penerima tamu</Badge>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function WatchPage() {
  useTitle('Hari H')
  const state = useStaff('watch/')
  return (
    <>
      <PageHead eyebrow="Hari ini" title="Hari H"
        lead="Pernikahan dari hari ini sampai dua minggu ke depan. Belum aktif atau tanpa acara berarti tamu tidak bisa membuka undangannya dengan benar: hubungi pasangan. Check-in tampil di hari H." />
      <Card className="bo-card-dark">
        <Data state={state}>
          {d => (d.results.length ? <WatchList rows={d.results} />
            : <Empty>Tidak ada pernikahan dalam {d.days} hari ke depan.</Empty>)}
        </Data>
      </Card>
    </>
  )
}
