import { Link } from 'react-router-dom'
import { Badge, Data, PageHead, num, useStaff, useTitle } from '../ui.jsx'

export default function ThemesPage() {
  useTitle('Tema')
  const state = useStaff('themes/')
  return (
    <>
      <PageHead eyebrow="Bisnis" title="Tema yang dipilih"
        lead="Undangan di tiap tema sekarang (tanpa demo), dan pergerakan 90 hari terakhir. Yang sering ditinggalkan, atau dipilih tapi jarang dibayar, layak dilihat lagi. Urutan: dibayar, lalu total." />
      <Data state={state}>
        {d => (
          <div className="bo-themes">
            {d.results.map(t => (
              <article key={t.id} className="bo-theme">
                <div className="bo-theme-art dg-dark">
                  {t.preview ? <img src={t.preview} alt="" loading="lazy" /> : <span />}
                </div>
                <div className="bo-theme-body">
                  <div className="bo-theme-head">
                    <h2><Link to={`/tema/${t.id}`} target="_blank" rel="noopener noreferrer">{t.name}</Link></h2>
                    {t.status !== 'active' && <Badge>{t.status}</Badge>}
                  </div>
                  <dl className="bo-theme-nums">
                    <div><dt>Undangan</dt><dd className="dg-num">{num(t.total)}</dd></div>
                    <div><dt>Aktif</dt><dd className="dg-num">{num(t.live)}</dd></div>
                    <div><dt>Dibayar</dt><dd className="dg-num">{num(t.paid)}</dd></div>
                  </dl>
                  <p className="bo-quiet">
                    {d.days} hari: {num(t.created)} baru · {num(t.to)} pindah ke sini · {num(t.away)} ditinggalkan
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </Data>
    </>
  )
}
