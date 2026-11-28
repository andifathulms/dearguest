import { Badge, Card, Data, Empty, PageHead, date, num, pct, rupiah, useStaff, useTitle } from '../ui.jsx'

export default function GrowthPage() {
  useTitle('Pertumbuhan')
  const state = useStaff('growth/')
  return (
    <>
      <PageHead eyebrow="Bisnis" title="Pertumbuhan"
        lead="Dari mana pasangan datang, dan seberapa banyak yang lanjut. Sumber diambil dari utm_source di tautan; tanpa sumber berarti datang langsung. Anonim: hanya hitungan." />
      <Data state={state}>
        {d => (
          <div className="bo-stack">
            <Card title={`Per sumber · ${d.weeks} minggu`} aside={<span className="bo-quiet">sejak {date(d.since)}</span>}>
              {d.sources.length ? (
                <div className="bo-table-wrap">
                  <table className="bo-table">
                    <thead><tr><th>Sumber</th><th className="num">Kunjungan</th><th className="num">Daftar</th>
                      <th className="num">→ daftar</th><th className="num">Buat undangan</th><th className="num">→ undangan</th></tr></thead>
                    <tbody>
                      {d.sources.map(s => (
                        <tr key={s.source}>
                          <td>{s.source || <span className="bo-quiet">langsung</span>}</td>
                          <td className="num dg-num">{num(s.visit)}</td>
                          <td className="num dg-num">{num(s.register)}</td>
                          <td className="num dg-num">{pct(s.register, s.visit)}</td>
                          <td className="num dg-num">{num(s.onboarded)}</td>
                          <td className="num dg-num">{pct(s.onboarded, s.register)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <Empty>Belum ada kunjungan tercatat.</Empty>}
            </Card>
            <Card title="Kupon" aside={<span className="bo-quiet">dipakai = pembayaran tercatat dengan kupon itu</span>}>
              {d.coupons.length ? (
                <div className="bo-table-wrap">
                  <table className="bo-table">
                    <thead><tr><th>Kode</th><th className="num">Diskon</th><th>Status</th><th className="num">Dipakai</th>
                      {'revenue' in d.coupons[0] && <th className="num">Pendapatan</th>}<th>Keterangan</th></tr></thead>
                    <tbody>
                      {d.coupons.map(c => (
                        <tr key={c.code}>
                          <td><b>{c.code}</b></td>
                          <td className="num dg-num">{c.discount_percent}%</td>
                          <td><Badge tone={c.valid ? 'good' : 'muted'}>{c.valid ? 'berlaku' : 'tidak berlaku'}</Badge></td>
                          <td className="num dg-num">{num(c.used)}</td>
                          {'revenue' in c && <td className="num dg-num">{c.revenue ? rupiah(c.revenue) : '—'}</td>}
                          <td className="bo-quiet">{c.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <Empty>Belum ada kupon. Kupon dibuat di admin.</Empty>}
            </Card>
          </div>
        )}
      </Data>
    </>
  )
}
