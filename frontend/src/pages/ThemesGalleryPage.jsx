import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { THEME_CATALOG, THEME_CATEGORIES } from '../data/themes.js'
import './LandingPage.css'
import './ThemesGalleryPage.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'
const waOrder = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Halo, saya ingin memesan undangan digital')}`

export default function ThemesGalleryPage() {
  const [category, setCategory] = useState('Semua')
  const list = category === 'Semua'
    ? THEME_CATALOG
    : THEME_CATALOG.filter(t => t.category === category)

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
          <h1 className="lp-serif">{THEME_CATALOG.length} Tema Undangan Eksklusif</h1>
          <p className="tg-sub">Temukan gaya yang paling mewakili kalian — dari yang elegan dan mewah hingga lembut dan natural. Klik tema mana pun untuk melihat demo lengkapnya.</p>
        </div>
      </header>

      {/* Filter chips */}
      <div className="tg-filter-wrap">
        <div className="lp-container tg-filter">
          {THEME_CATEGORIES.map(cat => {
            const count = cat === 'Semua' ? THEME_CATALOG.length : THEME_CATALOG.filter(t => t.category === cat).length
            return (
              <button
                key={cat}
                className={`tg-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat} <span className="tg-chip-count">{count}</span>
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
                <div className={`lp-theme-preview ${t.preview}`}>
                  {t.badge && <span className="tp-badge">{t.badge}</span>}
                  <span className="tp-label">The Wedding Of</span>
                  <div className="tp-names lp-serif">
                    Andini<span className="tp-amp">&amp;</span>Bagus
                  </div>
                  <div className="tp-rule" />
                  <span className="tp-date">12 · 12 · 2026</span>
                </div>
                <div className="lp-theme-body">
                  <div className="tg-card-head">
                    <h3>{t.name}</h3>
                    <span className="tg-card-cat">{t.category}</span>
                  </div>
                  <p>{t.desc}</p>
                  <div className="lp-theme-swatches">
                    {t.colors.map(c => <span key={c} style={{ background: c }} />)}
                  </div>
                  <a className="lp-theme-demo" href={`/${t.demo}`} target="_blank" rel="noopener noreferrer">Lihat Demo Lengkap ↗</a>
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
