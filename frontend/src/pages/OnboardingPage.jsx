import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import './Auth.css'

const THEMES = [
  { id: 'javanese-dark', name: 'Javanese Malam Emas', swatch: 'linear-gradient(135deg,#1a1208,#c9a84c)' },
  { id: 'floral-light', name: 'Taman Bunga', swatch: 'linear-gradient(135deg,#f7ede8,#c4847a)' },
  { id: 'modern-minimalist', name: 'Minimalis Putih', swatch: 'linear-gradient(135deg,#ffffff,#8a9e8a)' },
  { id: 'luxury-emerald', name: 'Zamrud Mewah', swatch: 'linear-gradient(135deg,#0e1f17,#d4af5a)' },
  { id: 'rustic-kraft', name: 'Rustic Kraft', swatch: 'linear-gradient(135deg,#e9ddc8,#7c8b6b)' },
  { id: 'boho-terracotta', name: 'Senja Terakota', swatch: 'linear-gradient(135deg,#fbf3ea,#c06a4d)' },
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
          <span className="auth-brand-mark">U</span>
          <span>Undangan<em>Digital</em></span>
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
                  <div className="onb-theme-swatch" style={{ background: t.swatch }} />
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
