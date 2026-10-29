import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { catalogThemes, selectableThemes } from '../themes/registry.js'
import ThemePreview from '../themes/ThemePreview.jsx'
import { trackVisit } from '../utils/funnel.js'
import './LandingPage.css'
import './ThemesGalleryPage.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'
const waOrder = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Halo, saya ingin memesan undangan digital')}`

const CATALOG = catalogThemes()
const THEME_COUNT = selectableThemes().length

// Filter chips follow the catalogue: "Semua", then "Cinematic" when that
// collection is listed, then each category in first-seen order.
const CATEGORIES = [
  'Semua',
  ...(CATALOG.some(t => t.collection === 'cinematic') ? ['Cinematic'] : []),
  ...new Set(CATALOG.map(t => t.category)),
]

// 'Cinematic' filters by collection; everything else by category.
const matchCat = (t, cat) =>
  cat === 'Semua' ? true : cat === 'Cinematic' ? t.collection === 'cinematic' : t.category === cat

export default function ThemesGalleryPage() {
  const [category, setCategory] = useState('Semua')
  useEffect(trackVisit, [])
  const list = CATALOG.filter(t => matchCat(t, category))

  return (
    <div className="lp tg-page">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand">
            <span className="lp-brand-mark">D</span>
            <span>Dear<em>Guest</em></span>
          </Link>
          <a href={waOrder} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary lp-nav-cta">
            Pesan Sekarang
          </a>
        </div>
      </nav>

      {/* Header */}
      <header className="tg-header">
        <div className="lp-container">
          <Link to="/" className="tg-back">← Kembali ke beranda</Link>
          <p className="lp-eyebrow">Galeri Tema</p>
          <h1 className="lp-serif">{THEME_COUNT} Tema Undangan Eksklusif</h1>
          <p className="tg-sub">Temukan gaya yang paling mewakili kalian — dari yang elegan dan mewah hingga lembut dan natural. Arahkan kursor (atau gulir di ponsel) untuk melihatnya bergerak, lalu buka tema untuk mencoba demonya.</p>
        </div>
      </header>

      {/* Filter chips */}
      <div className="tg-filter-wrap">
        <div className="lp-container tg-filter">
          {CATEGORIES.map(cat => {
            const count = CATALOG.filter(t => matchCat(t, cat)).length
            return (
              <button
                key={cat}
                className={`tg-chip ${category === cat ? 'active' : ''} ${cat === 'Cinematic' ? 'tg-chip-cine' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'Cinematic' ? '✨ Cinematic' : cat} <span className="tg-chip-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <section className="lp-section tg-grid-section">
        <div className="lp-container">
          <div className="lp-theme-grid">
            {list.map((t, i) => (
              <motion.div
                className="lp-theme-card"
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
              >
                <Link to={`/tema/${t.id}`} className="tg-card-link" aria-label={`Lihat tema ${t.name}`}>
                  <ThemePreview theme={t} loop badge={t.status === 'coming' ? 'Segera hadir' : undefined} />
                </Link>
                <div className="lp-theme-body">
                  <div className="tg-card-head">
                    <h3><Link to={`/tema/${t.id}`}>{t.name}</Link></h3>
                    <span className="tg-card-cat">{t.category}</span>
                  </div>
                  <p>{t.desc}</p>
                  <div className="lp-theme-swatches">
                    {t.colors.map(c => <span key={c} style={{ background: c }} />)}
                  </div>
                  {t.status === 'coming' || !t.demo
                    ? <span className="lp-theme-soon">Segera hadir</span>
                    : <Link className="lp-theme-demo" to={`/tema/${t.id}`}>Lihat tema &amp; demo →</Link>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="tg-cta">
        <div className="lp-container">
          <h2 className="lp-serif">Sudah menemukan yang cocok?</h2>
          <p>Konsultasikan tema pilihan kalian sekarang — gratis, tanpa komitmen.</p>
          <a href={waOrder} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-wa">
            Chat WhatsApp Sekarang
          </a>
        </div>
      </section>
    </div>
  )
}
