import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { publicOrigin } from '../utils/publicUrl.js'
import { selectableThemes } from '../themes/registry.js'
import { variantOptions } from '../copy/copy.js'
import { chosenTheme } from '../utils/themeChoice.js'
import { storedUtm } from '../utils/funnel.js'
import AuthShell from '../brand/AuthShell.jsx'
import './Auth.css'

// Themes a couple can pick right now (registry status "active").
const THEMES = selectableThemes()

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [slug, setSlug] = useState('')
  const [theme, setTheme] = useState(() => chosenTheme(THEMES.map(t => t.id)) || THEMES[0]?.id || '')
  const [weddingDate, setWeddingDate] = useState('')
  const [variant, setVariant] = useState('')
  const [check, setCheck] = useState(null) // {valid, available}
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const debounce = useRef(null)

  // Require login. A couple may create several invitations, so no redirect here.
  useEffect(() => {
    api.get('/auth/me/').catch(() => navigate('/dashboard'))
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
    if (!variant) { setError('Pilih gaya bahasa undangan.'); return }
    setLoading(true)
    try {
      await api.post('/my/invitations/', { slug, theme, wedding_date: weddingDate, copy_variant: variant, utm: storedUtm() })
      navigate(`/dashboard/${slug}/edit`)
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.slug?.[0] || 'Gagal membuat undangan. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <AuthShell wide>
      <div className="auth-card auth-wide">
        <h1>Buat Undangan Baru</h1>
        <p className="auth-sub">Tentukan alamat, tema, dan tanggal. Semua bisa diubah nanti di editor.</p>

        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="onb-slug">Alamat undangan</label>
            <div className="onb-slug">
              <span>{publicOrigin}/</span>
              <input
                className="auth-input"
                id="onb-slug"
                value={slug}
                onChange={e => setSlug(slugify(e.target.value))}
                placeholder="dinda-raka"
                required
              />
            </div>
            {slug && check && (
              check.available
                ? <p className="auth-hint ok">Tersedia</p>
                : <p className="auth-hint bad">✕ {check.valid ? 'Sudah dipakai, pilih yang lain' : 'Format tidak valid'}</p>
            )}
          </div>

          <div className="auth-field">
            <span className="auth-label" id="onb-theme-label">Pilih tema</span>
            <div className="onb-themes" role="group" aria-labelledby="onb-theme-label">
              {THEMES.map(t => (
                <button
                  type="button"
                  key={t.id}
                  className={`onb-theme ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                  aria-pressed={theme === t.id}
                >
                  {t.previewImage
                    ? <img src={t.previewImage} alt="" loading="lazy" />
                    : <span className="onb-mock" style={{ background: t.card.bg }} />}
                  <div className="onb-theme-name">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-field">
            <span className="auth-label" id="onb-variant-label">Gaya bahasa undangan</span>
            <div className="onb-variants" role="radiogroup" aria-labelledby="onb-variant-label">
              {variantOptions().map(v => (
                <button type="button" key={v.id} role="radio" aria-checked={variant === v.id}
                  className={`onb-variant ${variant === v.id ? 'active' : ''}`} onClick={() => setVariant(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
            <p className="auth-hint">Menentukan salam, ayat, dan istilah acara. Bisa diubah nanti di editor.</p>
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
    </AuthShell>
  )
}
