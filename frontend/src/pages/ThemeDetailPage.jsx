import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { catalogThemes } from '../themes/registry.js'
import { variantOptions } from '../copy/copy.js'
import { rememberTheme } from '../utils/themeChoice.js'
import { useSession } from '../api/session.js'
import { trackVisit } from '../utils/funnel.js'
import { SiteNav, SiteFooter, StickyBar } from '../brand/SiteChrome.jsx'
import { Icon } from '../brand/icons.jsx'
import '../brand/brand.css'
import './ThemeDetailPage.css'

const CATALOG = catalogThemes()

// One theme: its live demo in a phone frame, with the copy-variant toggle
// (the server honours ?variant= on demo invitations only), and "Pakai tema
// ini", which carries the choice through registration into onboarding.
export default function ThemeDetailPage() {
  const { id } = useParams()
  const theme = CATALOG.find(t => t.id === id)
  const [variant, setVariant] = useState('islam')
  const session = useSession()
  useEffect(trackVisit, [])
  useEffect(() => { window.scrollTo(0, 0) }, [id])

  if (!theme) {
    return (
      <div className="dg td-page">
        <SiteNav />
        <div className="dg-container td-missing">
          <h1 className="dg-h2">Tema tidak ditemukan</h1>
          <Link to="/tema" className="dg-btn dg-btn-ink">Lihat semua tema</Link>
        </div>
      </div>
    )
  }

  const live = theme.status !== 'coming' && theme.demo
  const useHref = `${session ? '/onboarding' : '/register'}?theme=${theme.id}`
  const demoUrl = live ? `/${theme.demo}?variant=${variant}` : null
  // Other themes: same category first, then the rest; four at most.
  const others = CATALOG.filter(t => t.id !== theme.id && t.status !== 'coming')
    .sort((a, b) => (b.category === theme.category) - (a.category === theme.category))
    .slice(0, 4)
  const use = { to: useHref, label: 'Pakai tema ini' }

  return (
    <div className="dg td-page">
      <SiteNav />
      <main className="td-stage dg-dark">
        <div className="dg-container td-main">
          <div className="td-phone dg-phone">
            {demoUrl ? (
              <iframe key={demoUrl} src={demoUrl} title={`Demo tema ${theme.name}`} loading="lazy" />
            ) : (
              <img src={theme.previewImage} alt={`Pratinjau tema ${theme.name}`} />
            )}
          </div>

          <div className="td-info">
            <Link to="/tema" className="td-back">{Icon.back} Galeri tema</Link>
            <p className="dg-eyebrow">{theme.category}</p>
            <h1 className="dg-display">{theme.name}</h1>
            <p className="td-desc">{theme.desc}</p>
            <div className="td-swatches" aria-label="Warna tema">
              {theme.colors.map(c => <span key={c} style={{ background: c }} />)}
            </div>

            {live && (
              <fieldset className="td-variants">
                <legend>Lihat dengan teks</legend>
                <div className="td-variant-row">
                  {variantOptions().map(v => (
                    <button key={v.id} type="button" aria-pressed={variant === v.id} className="dg-chip" onClick={() => setVariant(v.id)}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <p className="td-note">Salam pembuka, nama acara, dan ayat mengikuti pilihan ini. Kalian bisa mengubahnya kapan saja.</p>
              </fieldset>
            )}

            <div className="td-actions">
              {live ? (
                <>
                  <Link to={useHref} className="dg-btn dg-btn-gold" onClick={() => rememberTheme(theme.id)}>Pakai tema ini</Link>
                  <a href={`${demoUrl}&from=tema`} target="_blank" rel="noopener noreferrer" className="dg-btn dg-btn-line">Buka demo layar penuh {Icon.external}</a>
                </>
              ) : (
                <span className="td-soon">Segera hadir</span>
              )}
            </div>
            <ul className="td-included">
              <li>{Icon.check}Nama setiap tamu di sampul</li>
              <li>{Icon.check}RSVP, peta, amplop digital, dan ucapan</li>
              <li>{Icon.check}Gratis dicoba, ganti tema kapan saja</li>
            </ul>
          </div>
        </div>
      </main>

      {others.length > 0 && (
        <section className="dg-band td-others">
          <div className="dg-container">
            <div className="td-others-head">
              <h2 className="dg-h3">Tema lainnya</h2>
              <Link to="/tema" className="dg-link">Semua tema</Link>
            </div>
            <div className="td-others-row">
              {others.map(t => (
                <Link key={t.id} to={`/tema/${t.id}`} className="td-other">
                  <img src={t.previewImage} alt="" loading="lazy" />
                  <span>{t.name}</span>
                  <small>{t.category}</small>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <SiteFooter />
      {live && <StickyBar primary={use} secondary={{ to: '/tema', label: 'Tema lain' }} />}
    </div>
  )
}
