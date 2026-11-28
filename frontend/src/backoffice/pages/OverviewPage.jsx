import { Link } from 'react-router-dom'
import {
  Badge, Card, Data, Empty, PageHead, Stat, ago, change, date, num, rupiah, useMe, useStaff, useTitle,
} from '../ui.jsx'
import { FeedList } from './ActivityPage.jsx'
import { WatchList } from './WatchPage.jsx'

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date()))
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function OverviewPage() {
  useTitle('Ringkasan')
  const me = useMe()
  const state = useStaff('overview/')
  return (
    <>
      <PageHead eyebrow="Ringkasan" title={<>{greeting()}, <em>{me.username}</em></>}
        lead="Apa yang menunggu kamu, pernikahan minggu ini, dan apa yang terjadi di Vowvella." />
      <Data state={state}>{d => <Overview d={d} />}</Data>
    </>
  )
}

function Overview({ d }) {
  const n = d.numbers
  const tiers = n.live_by_tier || {}
  return (
    <div className="bo-stack">
      <div className="bo-stats">
        <Stat label="Menunggu aktivasi" value={num(n.pending_activations)} action={n.pending_activations > 0}
          note={n.oldest_pending_at ? `tertua ${ago(n.oldest_pending_at)}` : 'tidak ada'} to="/backoffice/aktivasi" />
        <Stat label="Laporan baru" value={num(n.reports_new)} action={n.reports_new > 0}
          note="takedown dan penyalahgunaan" to="/backoffice/laporan" />
        <Stat label="Daftar baru · 7 hari" value={num(n.signups_week)} note={change(n.signups_week, n.signups_prev_week)}
          to="/backoffice/pasangan" />
        <Stat label="Undangan aktif" value={num(n.live)} to="/backoffice/undangan"
          note={`${tiers.premium || 0} Premium · ${tiers.bisnis || 0} Bisnis · ${tiers.free || 0} Gratis`} />
        <Stat label="Undangan baru · 7 hari" value={num(n.new_invitations_week)} note={`${n.activated_week} jadi aktif`} />
        <Stat label="RSVP · 7 hari" value={num(n.rsvps_week)} note={change(n.rsvps_week, n.rsvps_prev_week)} />
        <Stat label="Ucapan ditahan" value={num(n.wishes_held)} to="/backoffice/ucapan"
          note={`menunggu pasangan · ${n.wishes_held_invitations} undangan`} />
        {'revenue_month' in n && (
          <Stat label="Pendapatan · bulan ini" value={rupiah(n.revenue_month)} to="/backoffice/pendapatan"
            note={`${n.payments_month} pembayaran dicatat`} />
        )}
      </div>

      <Card title={`Hari H · ${d.watch_days} hari ke depan`} className="bo-card-dark"
        aside={<Link to="/backoffice/hari-h" className="bo-more">Semua →</Link>}>
        {d.watch.length ? <WatchList rows={d.watch} compact />
          : <Empty>Tidak ada pernikahan dalam {d.watch_days} hari ke depan.</Empty>}
      </Card>

      <div className="bo-split">
        <Card title="Aktivitas terbaru" aside={<Link to="/backoffice/aktivitas" className="bo-more">Semua →</Link>}>
          <FeedList rows={d.feed} />
        </Card>
        <div className="bo-stack">
          <Card title="Funnel minggu ini" aside={<span className="bo-quiet">sejak {date(d.funnel.week, { day: 'numeric', month: 'short' })}</span>}>
            <Funnel steps={d.funnel.steps} />
          </Card>
          <Card title="Sistem" aside={<Link to="/backoffice/sistem" className="bo-more">Detail →</Link>}>
            <div className="bo-badges">
              {d.system.checks.map(c => <Badge key={c.key} tone={c.ok ? 'good' : 'bad'}>{c.name}{c.detail ? ` · ${c.detail}` : ''}</Badge>)}
              {d.system.jobs.map(j => <Badge key={j.job} tone={j.ok ? 'good' : 'warn'}>{j.job} · {j.last ? ago(j.last) : 'belum jalan'}</Badge>)}
              <Badge>rilis {d.system.release.slice(0, 7)}</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function Funnel({ steps }) {
  const top = Math.max(steps[0]?.n || 0, 1)
  return (
    <div className="bo-bars">
      {steps.map(s => (
        <div key={s.key} className="bo-bar-row">
          <span>{s.label}</span>
          <span className="bo-bar">{!s.pending && <i style={{ width: `${(s.n / top) * 100}%` }} />}</span>
          <b className="dg-num">{s.pending ? '—' : num(s.n)}</b>
        </div>
      ))}
      <p className="bo-quiet bo-note">Anonim, hanya hitungan. Mulai bayar dan lunas terisi setelah pembayaran online ada.</p>
    </div>
  )
}
