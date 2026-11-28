import { Link } from 'react-router-dom'
import { Card, Data, Empty, PageHead, Stat, TIER, date, dateTime, num, rupiah, useStaff, useTitle } from '../ui.jsx'

export default function RevenuePage() {
  useTitle('Pendapatan')
  const state = useStaff('revenue/')
  return (
    <>
      <PageHead eyebrow="Bisnis · khusus pemilik" title="Pendapatan"
        lead="Dari pembayaran yang dicatat saat konfirmasi aktivasi. Pembayaran online belum ada, jadi semua angka di sini dicatat manual." />
      <Data state={state}>{d => <Revenue d={d} />}</Data>
    </>
  )
}

function Split({ title, rows }) {
  return (
    <Card title={title}>
      {rows.length ? (
        <ul className="bo-list">
          {rows.map(r => (
            <li key={r.key ?? 'none'} className="bo-split-row">
              <span>{r.label}</span><span className="bo-quiet dg-num">{num(r.n)}×</span><b className="dg-num">{rupiah(r.total)}</b>
            </li>
          ))}
        </ul>
      ) : <Empty>Belum ada pembayaran.</Empty>}
    </Card>
  )
}

function Revenue({ d }) {
  const top = Math.max(...d.months.map(m => m.total), 1)
  return (
    <div className="bo-stack">
      <div className="bo-stats">
        <Stat label="Total 12 bulan" value={rupiah(d.total)} note={`${num(d.count)} pembayaran sejak ${date(d.since, { month: 'long', year: 'numeric' })}`} />
        <Stat label="Rata-rata per pembayaran" value={d.count ? rupiah(Math.round(d.total / d.count)) : '—'} />
        <Stat label="Bulan ini" value={rupiah(d.months[d.months.length - 1]?.total)} note={`${num(d.months[d.months.length - 1]?.n)} pembayaran`} />
      </div>
      <Card title="Per bulan">
        <div className="bo-months" role="img" aria-label="Pendapatan per bulan, 12 bulan terakhir">
          {d.months.map(m => (
            <div key={m.month} className="bo-month" title={`${date(m.month, { month: 'long', year: 'numeric' })}: ${rupiah(m.total)}`}>
              <span className="bo-month-val dg-num">{m.total ? `${Math.round(m.total / 1000)}rb` : ''}</span>
              <span className="bo-month-bar"><i style={{ height: `${(m.total / top) * 100}%` }} /></span>
              <span className="bo-month-label">{date(m.month, { month: 'short' })}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="bo-split three">
        <Split title="Per paket" rows={d.by_tier} />
        <Split title="Per cara bayar" rows={d.by_channel} />
        <Split title="Per kupon" rows={d.by_coupon} />
      </div>
      <Card title="Pembayaran terakhir">
        {d.recent.length ? (
          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead><tr><th>Waktu</th><th>Undangan</th><th>Paket</th><th>Lewat</th><th>Kupon</th><th>Dicatat</th><th className="num">Jumlah</th></tr></thead>
              <tbody>
                {d.recent.map(p => (
                  <tr key={p.id}>
                    <td className="dg-num">{dateTime(p.at)}</td>
                    <td>{p.slug ? <Link to={`/backoffice/undangan/${p.invitation_id}`} className="bo-slug">{p.slug}</Link> : <span className="bo-quiet">akun dihapus</span>}</td>
                    <td>{TIER[p.tier]}</td><td>{p.channel_label}</td><td>{p.coupon || '—'}</td><td>{p.recorded_by || '—'}</td>
                    <td className="num dg-num"><b>{rupiah(p.amount)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>Belum ada pembayaran tercatat. Pembayaran dicatat saat konfirmasi lunas di Aktivasi.</Empty>}
      </Card>
    </div>
  )
}
