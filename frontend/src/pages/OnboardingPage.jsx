import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import './Auth.css'

const THEMES = [
  { id: 'javanese-dark', name: 'Javanese Gold Night', bg: 'radial-gradient(ellipse at center, rgba(201,168,76,0.16), #1a1208 75%)', fg: '#c9a84c', accent: '#b6a06a' },
  { id: 'floral-light', name: 'Flower Garden', bg: 'linear-gradient(160deg,#f7ede8,#fdf8f5)', fg: '#2d1f1c', accent: '#c4847a' },
  { id: 'modern-minimalist', name: 'White Minimalist', bg: '#ffffff', fg: '#1f1f1f', accent: '#8a9e8a' },
  { id: 'luxury-emerald', name: 'Luxury Emerald', bg: 'radial-gradient(ellipse at center, rgba(212,175,90,0.14), #0e1f17 75%)', fg: '#d4af5a', accent: '#b6a06a' },
  { id: 'rustic-kraft', name: 'Rustic Kraft', bg: 'linear-gradient(160deg,#e9ddc8,#f3ece0)', fg: '#3a3026', accent: '#7c8b6b' },
  { id: 'boho-terracotta', name: 'Terracotta Dusk', bg: 'radial-gradient(ellipse at 50% 120%, rgba(192,106,77,0.28), #fbf3ea 70%)', fg: '#4a2f24', accent: '#c06a4d' },
  { id: 'burgundy-gold', name: 'Burgundy Gold', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(203,163,90,0.18), transparent 60%), #2a0e16', fg: '#f4e7df', accent: '#cba35a' },
  { id: 'dusty-blue', name: 'Dusty Blue', bg: 'linear-gradient(160deg, #e3eaf0, #eef2f6)', fg: '#2b3a47', accent: '#6e88a6' },
  { id: 'midnight-celestial', name: 'Celestial Night', bg: 'radial-gradient(ellipse 90% 70% at center, rgba(216,192,116,0.16), transparent 62%), #0d1330', fg: '#eef0fa', accent: '#d8c074' },
  { id: 'sage-botanical', name: 'Sage Garden', bg: 'linear-gradient(160deg, #e2eadd, #eef2ea)', fg: '#2c3a2c', accent: '#7d9471' },
  { id: 'mauve-rose', name: 'Elegant Mauve', bg: 'linear-gradient(160deg, #ece0e4, #f6eef0)', fg: '#3a2a30', accent: '#b07c8a' },
  { id: 'ivory-classic', name: 'Ivory Classic', bg: 'linear-gradient(160deg, #efe6d4, #f7f1e6)', fg: '#3d3324', accent: '#c9a86a' },
  { id: 'tropical-green', name: 'Tropical Green', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(216,182,90,0.18), transparent 60%), #0f2417', fg: '#eef3ea', accent: '#d8b65a' },
  { id: 'lavender-dream', name: 'Lavender Dream', bg: 'linear-gradient(160deg, #e6def2, #f1edf7)', fg: '#322a40', accent: '#8a76b0' },
  { id: 'coral-peach', name: 'Warm Coral', bg: 'linear-gradient(160deg, #f8ded2, #fdf0ea)', fg: '#43291f', accent: '#e08a6a' },
  { id: 'charcoal-marble', name: 'Charcoal Marble', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(201,168,106,0.16), transparent 60%), #1e1e22', fg: '#f0f0f2', accent: '#c9a86a' },
  { id: 'islamic-arabesque', name: 'Golden Arabesque', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(212,175,90,0.18), transparent 60%), #0e2a24', fg: '#f1ece0', accent: '#d4af5a' },
  { id: 'navy-gold', name: 'Classic Navy', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(201,168,106,0.16), transparent 62%), #101a33', fg: '#eef1f8', accent: '#c9a86a' },
  { id: 'plum-gold', name: 'Plum Gold', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(203,163,90,0.18), transparent 60%), #241026', fg: '#f3e8f0', accent: '#cba35a' },
  { id: 'teal-ocean', name: 'Ocean Teal', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(214,180,92,0.18), transparent 60%), #07252b', fg: '#e8f3f1', accent: '#d6b45c' },
  { id: 'deco-noir', name: 'Art Deco Noir', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(205,163,73,0.2), transparent 60%), #0c0c0e', fg: '#f2efe6', accent: '#cda349' },
  { id: 'sunflower-mustard', name: 'Golden Sunflower', bg: 'linear-gradient(160deg, #f7ebc8, #fdf6e3)', fg: '#3d3018', accent: '#d49a2a' },
  { id: 'beige-korean', name: 'Aesthetic Beige', bg: 'linear-gradient(160deg, #e8dfd2, #f3ede4)', fg: '#4a4136', accent: '#a89a86' },
  { id: 'rose-gold', name: 'Rose Gold', bg: 'linear-gradient(160deg, #f3ddd3, #fbeee9)', fg: '#4a2e28', accent: '#c98a76' },
  { id: 'mono-editorial', name: 'Editorial Mono', bg: 'linear-gradient(160deg, #f4f4f4, #ffffff)', fg: '#141414', accent: '#111111' },
  { id: 'royal-purple', name: 'Royal Purple', bg: 'radial-gradient(ellipse 80% 70% at center, rgba(203,163,90,0.18), transparent 60%), #1e1233', fg: '#efe9f5', accent: '#cba35a' },
  { id: 'marble-white', name: 'White Marble', bg: 'linear-gradient(160deg, #efece5, #f8f6f2)', fg: '#3a342a', accent: '#c2a35e' },
  { id: 'celestial-cinematic', name: 'Celestial 3D', bg: 'radial-gradient(ellipse 90% 70% at center, rgba(216,192,116,0.18), transparent 62%), #070b1f', fg: '#eef0fa', accent: '#d8c074' },
  { id: 'petals-3d', name: 'Enchanted Petals', bg: 'linear-gradient(160deg, #f7dde3, #fbeef0)', fg: '#4a2e34', accent: '#c4847a' },
  { id: 'aurora-3d', name: 'Aurora Dream', bg: 'radial-gradient(ellipse 90% 70% at center, rgba(63,182,160,0.22), transparent 62%), #070b1f', fg: '#e8f3f1', accent: '#3fb6a0' },
  { id: 'golden-3d', name: 'Golden Aura', bg: 'radial-gradient(ellipse 90% 70% at center, rgba(232,200,121,0.22), transparent 62%), #0c0c0e', fg: '#f2efe6', accent: '#e8c879' },
  { id: 'clouds-3d', name: 'Ethereal Clouds', bg: 'linear-gradient(160deg, #dfe6f0, #eef1f6)', fg: '#3a342a', accent: '#c9a86a' },
]

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [slug, setSlug] = useState('')
  const [theme, setTheme] = useState('javanese-dark')
  const [weddingDate, setWeddingDate] = useState('')
  const [check, setCheck] = useState(null) // {valid, available}
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const debounce = useRef(null)

  // Require login. A couple may create several invitations, so no redirect here.
  useEffect(() => {
    if (!localStorage.getItem('access_token')) navigate('/dashboard')
  }, [navigate])

  // Debounced slug availability check.
  useEffect(() => {
    if (!slug) { setCheck(null); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      api.get(`/my/slug-check/?slug=${encodeURIComponent(slug)}`)
        .then(res => setCheck(res.data))
        .catch(() => setCheck(null))
    }, 400)
    return () => clearTimeout(debounce.current)
  }, [slug])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!slug || !check?.available) { setError('Pilih alamat undangan yang tersedia.'); return }
    if (!weddingDate) { setError('Isi tanggal pernikahan.'); return }
    setLoading(true)
    try {
      await api.post('/my/invitations/', { slug, theme, wedding_date: weddingDate })
      navigate(`/dashboard/${slug}/edit`)
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.slug?.[0] || 'Gagal membuat undangan. Coba lagi.')
      setLoading(false)
    }
  }

  const origin = window.location.origin

  return (
    <div className="auth">
      <div className="auth-card auth-wide">
        <div className="auth-brand">
          <span className="auth-brand-mark">D</span>
          <span>Dear<em>Guest</em></span>
        </div>
        <h1>Buat Undangan Baru</h1>
        <p className="auth-sub">Tentukan alamat, tema, dan tanggal. Semua bisa diubah nanti di editor.</p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="onb-slug">Alamat undangan</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: '#a89a86' }}>{origin}/</span>
              <input
                className="auth-input"
                id="onb-slug"
                style={{ flex: 1, minWidth: '160px' }}
                value={slug}
                onChange={e => setSlug(slugify(e.target.value))}
                placeholder="dinda-raka"
                required
              />
            </div>
            {slug && check && (
              check.available
                ? <p className="auth-hint ok">✓ Tersedia</p>
                : <p className="auth-hint bad">✕ {check.valid ? 'Sudah dipakai, pilih yang lain' : 'Format tidak valid'}</p>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label">Pilih tema</label>
            <div className="onb-themes">
              {THEMES.map(t => (
                <button
                  type="button"
                  key={t.id}
                  className={`onb-theme ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                  aria-pressed={theme === t.id}
                >
                  <div className="onb-mock" style={{ background: t.bg, color: t.fg }}>
                    <span className="onb-mock-label" style={{ color: t.accent }}>The Wedding Of</span>
                    <span className="onb-mock-names">Andini &amp; Bagus</span>
                    <span className="onb-mock-rule" style={{ background: t.accent }} />
                  </div>
                  <div className="onb-theme-name">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="onb-date">Tanggal pernikahan</label>
            <input className="auth-input" id="onb-date" type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} required />
          </div>

          <button className="auth-btn" type="submit" disabled={loading || !check?.available}>
            {loading ? 'Membuat…' : 'Buat & Mulai Edit'}
          </button>
        </form>
      </div>
    </div>
  )
}
