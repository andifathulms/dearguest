import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { catalogThemes } from '../themes/registry.js'
import { variantOptions } from '../copy/copy.js'
import { rememberTheme } from '../utils/themeChoice.js'
import { trackVisit } from '../utils/funnel.js'
import './LandingPage.css'
import './ThemesGalleryPage.css'
import './ThemeDetailPage.css'

const CATALOG = catalogThemes()

// One theme: its live demo in a phone frame, with the copy-variant toggle
// (the server honours ?variant= on demo invitations only), and "Pakai tema
// ini", which carries the choice through registration into onboarding.
export default function ThemeDetailPage() {
  const { id } = useParams()
  const theme = CATALOG.find(t => t.id === id)
  const [variant, setVariant] = useState('islam')
  useEffect(trackVisit, [])

  if (!theme) {
    return (
      <div className="lp td-page">
        <div className="lp-container td-missing">
          <h1 className="lp-serif">Tema tidak ditemukan</h1>
          <Link to="/tema" className="lp-btn lp-btn-primary">Lihat semua tema</Link>
        </div>
      </div>
    )
  }

  const live = theme.status !== 'coming' && theme.demo
  const loggedIn = !!localStorage.getItem('access_token')
  const useHref = `${loggedIn ? '/onboarding' : '/register'}?theme=${theme.id}`
  const demoUrl = live ? `/${theme.demo}?variant=${variant}` : null
  const others = CATALOG.filter(t => t.id !== theme.id && t.status !== 'coming').slice(0, 3)

  return (
    <div className="lp td-page">
      <nav className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand">
            <span className="lp-brand-mark">D</span>
            <span>Dear<em>Guest</em></span>
          </Link>
          <Link to="/tema" className="lp-btn lp-btn-ghost lp-nav-cta">Semua tema</Link>
        </div>
      </nav>

      <main className="lp-container td-main">
        <div className="td-phone">
          {demoUrl ? (
            <iframe key={demoUrl} src={demoUrl} title={`Demo tema ${theme.name}`} loading="lazy" />
          ) : (
            <img src={theme.previewImage} alt={`Pratinjau tema ${theme.name}`} />
          )}
        </div>

        <div className="td-info">
          <Link to="/tema" className="tg-back">← Galeri tema</Link>
          <p className="lp-eyebrow">{theme.category}</p>
          <h1 className="lp-serif">{theme.name}</h1>
          <p className="td-desc">{theme.desc}</p>
          <div className="lp-theme-swatches td-swatches">
            {theme.colors.map(c => <span key={c} style={{ background: c }} />)}
          </div>

          {live && (
            <fieldset className="td-variants">
              <legend>Lihat dengan teks</legend>
              <div className="td-variant-row">
                {variantOptions().map(v => (
                  <button key={v.id} type="button" aria-pressed={variant === v.id}
                    className={`tg-chip ${variant === v.id ? 'active' : ''}`} onClick={() => setVariant(v.id)}>
                    {v.label}
                  </button>
                ))}
              </div>
              <p className="td-note">Salam pembuka, nama acara dan ayat mengikuti pilihan ini. Kalian bisa mengubahnya kapan saja.</p>
            </fieldset>
          )}

          <div className="td-actions">
            {live ? (
              <>
                <Link to={useHref} className="lp-btn lp-btn-primary" onClick={() => rememberTheme(theme.id)}>Pakai tema ini</Link>
                <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-ghost">Buka demo layar penuh ↗</a>
              </>
            ) : (
              <span className="lp-theme-soon">Segera hadir</span>
            )}
          </div>

          {others.length > 0 && (
            <div className="td-others">
              <p className="lp-eyebrow">Tema lainnya</p>
              <div className="td-others-row">
                {others.map(t => (
                  <Link key={t.id} to={`/tema/${t.id}`} className="td-other">
                    <img src={t.previewImage} alt="" loading="lazy" />
                    <span>{t.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
