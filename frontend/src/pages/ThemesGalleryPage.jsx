import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogThemes, selectableThemes } from '../themes/registry.js'
import ThemePreview from '../themes/ThemePreview.jsx'
import { trackVisit } from '../utils/funnel.js'
import { SiteNav, SiteFooter, StickyBar } from '../brand/SiteChrome.jsx'
import { Icon } from '../brand/icons.jsx'
import { WA_HELP } from '../brand/site.js'
import '../brand/brand.css'
import './ThemesGalleryPage.css'

const CATALOG = catalogThemes()
const THEME_COUNT = selectableThemes().length

// Filters come from the registry, so new packs and categories appear by
// themselves: "Cinematic" when that collection is listed, then each category in
// first-seen order. Mood (light / dark paper) is read from each card's colour.
const CATEGORIES = [
  'Semua',
  ...(CATALOG.some(t => t.collection === 'cinematic') ? ['Cinematic'] : []),
  ...new Set(CATALOG.map(t => t.category)),
]
const matchCat = (t, cat) =>
  cat === 'Semua' ? true : cat === 'Cinematic' ? t.collection === 'cinematic' : t.category === cat

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return 1
  const n = parseInt(m[1], 16)
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}
const moodOf = t => (luminance(t.card?.bg) < 0.45 ? 'Gelap' : 'Terang')
const MOODS = ['Semua suasana', ...['Terang', 'Gelap'].filter(m => CATALOG.some(t => moodOf(t) === m))]

export default function ThemesGalleryPage() {
  const [category, setCategory] = useState('Semua')
  const [mood, setMood] = useState(MOODS[0])
  useEffect(trackVisit, [])
  const list = CATALOG.filter(t => matchCat(t, category) && (mood === MOODS[0] || moodOf(t) === mood))

  return (
    <div className="dg tg-page">
      <SiteNav />
      <header className="tg-header dg-dark">
        <div className="dg-container tg-header-inner">
          <p className="dg-eyebrow">Galeri tema</p>
          <h1 className="dg-display">{THEME_COUNT} tema <em>berlukis</em></h1>
          <p className="dg-lead">
            Setiap sampul ditampilkan utuh, persis seperti yang dibuka tamu. Arahkan kursor (atau gulir di
            ponsel) untuk melihatnya bergerak, lalu buka tema untuk mencoba demonya.
          </p>
        </div>
      </header>

      <div className="tg-filter-wrap">
        <div className="dg-container tg-filter">
          <div className="tg-filter-group" role="group" aria-label="Kategori">
            {CATEGORIES.map(cat => (
              <button key={cat} type="button" className="dg-chip" aria-pressed={category === cat} onClick={() => setCategory(cat)}>
                {cat} <span className="count">{CATALOG.filter(t => matchCat(t, cat)).length}</span>
              </button>
            ))}
          </div>
          {MOODS.length > 2 && (
            <div className="tg-filter-group" role="group" aria-label="Suasana">
              {MOODS.map(m => (
                <button key={m} type="button" className="dg-chip" aria-pressed={mood === m} onClick={() => setMood(m)}>{m}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="dg-container tg-main">
        {list.length === 0 ? (
          <div className="tg-empty">
            <p>Belum ada tema dengan pilihan ini.</p>
            <button type="button" className="dg-btn dg-btn-line" onClick={() => { setCategory('Semua'); setMood(MOODS[0]) }}>Tampilkan semua</button>
          </div>
        ) : (
          <div className="tg-grid">
            {list.map(t => {
              const soon = t.status === 'coming' || !t.demo
              return (
                <article className="lp-theme-card" key={t.id}>
                  <Link to={`/tema/${t.id}`} className="tg-card-link" aria-label={`Lihat tema ${t.name}`}>
                    <ThemePreview theme={t} loop badge={soon ? 'Segera hadir' : undefined} />
                  </Link>
                  <div className="tg-card-body">
                    <h2><Link to={`/tema/${t.id}`}>{t.name}</Link></h2>
                    <p>{t.category} · {moodOf(t)}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <section className="dg-band paper tg-cta">
        <div className="dg-container tg-cta-inner">
          <h2 className="dg-h2">Sudah menemukan <em>yang cocok</em>?</h2>
          <p className="dg-lead">Buat undangannya sekarang, gratis untuk dicoba. Tema bisa diganti kapan saja.</p>
          <div className="tg-cta-actions">
            <Link to="/register" className="dg-btn dg-btn-ink">Buat Undangan {Icon.arrow}</Link>
            <a href={WA_HELP} target="_blank" rel="noopener noreferrer" className="dg-btn dg-btn-wa">{Icon.whatsapp} Tanya Admin</a>
          </div>
        </div>
      </section>
      <SiteFooter />
      <StickyBar />
    </div>
  )
}
