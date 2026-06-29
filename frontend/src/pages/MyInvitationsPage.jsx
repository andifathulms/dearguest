import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../api/client.js'
import './MyInvitations.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'

const THEME_NAME = {
  'javanese-dark': 'Javanese Gold Night',
  'floral-light': 'Flower Garden',
  'modern-minimalist': 'White Minimalist',
  'luxury-emerald': 'Luxury Emerald',
  'rustic-kraft': 'Rustic Kraft',
  'boho-terracotta': 'Terracotta Dusk',
  'burgundy-gold': 'Burgundy Gold',
  'dusty-blue': 'Dusty Blue',
  'midnight-celestial': 'Celestial Night',
  'sage-botanical': 'Sage Garden',
  'mauve-rose': 'Elegant Mauve',
  'ivory-classic': 'Ivory Classic',
  'tropical-green': 'Tropical Green',
  'lavender-dream': 'Lavender Dream',
  'coral-peach': 'Warm Coral',
  'charcoal-marble': 'Charcoal Marble',
  'islamic-arabesque': 'Golden Arabesque',
  'navy-gold': 'Classic Navy',
  'plum-gold': 'Plum Gold',
  'teal-ocean': 'Ocean Teal',
  'deco-noir': 'Art Deco Noir',
  'sunflower-mustard': 'Golden Sunflower',
  'beige-korean': 'Aesthetic Beige',
  'rose-gold': 'Rose Gold',
  'mono-editorial': 'Editorial Mono',
  'royal-purple': 'Royal Purple',
  'marble-white': 'White Marble',
  'celestial-cinematic': 'Celestial 3D',
}
const THEME_SWATCH = {
  'javanese-dark': 'linear-gradient(135deg,#1a1208,#c9a84c)',
  'floral-light': 'linear-gradient(135deg,#c4847a,#f7ede8)',
  'modern-minimalist': 'linear-gradient(135deg,#8a9e8a,#cfd8cf)',
  'luxury-emerald': 'linear-gradient(135deg,#0e1f17,#d4af5a)',
  'rustic-kraft': 'linear-gradient(135deg,#7c8b6b,#c9b48f)',
  'boho-terracotta': 'linear-gradient(135deg,#c06a4d,#d8b48a)',
  'burgundy-gold': 'linear-gradient(135deg,#6e1f31,#cba35a)',
  'dusty-blue': 'linear-gradient(135deg,#6e88a6,#b9c4cf)',
  'midnight-celestial': 'linear-gradient(135deg,#1b234e,#d8c074)',
  'sage-botanical': 'linear-gradient(135deg,#7d9471,#a9bca0)',
  'mauve-rose': 'linear-gradient(135deg,#b07c8a,#cfa9b3)',
  'ivory-classic': 'linear-gradient(135deg,#c9a86a,#e3d2ac)',
  'tropical-green': 'linear-gradient(135deg,#3c6b4a,#d8b65a)',
  'lavender-dream': 'linear-gradient(135deg,#8a76b0,#b7a9d4)',
  'coral-peach': 'linear-gradient(135deg,#e08a6a,#f2c0a4)',
  'charcoal-marble': 'linear-gradient(135deg,#2a2a30,#b8b8c0)',
  'islamic-arabesque': 'linear-gradient(135deg,#1f6b56,#d4af5a)',
  'navy-gold': 'linear-gradient(135deg,#2a3f66,#c9a86a)',
  'plum-gold': 'linear-gradient(135deg,#5a2a5e,#cba35a)',
  'teal-ocean': 'linear-gradient(135deg,#1f6b6b,#d6b45c)',
  'deco-noir': 'linear-gradient(135deg,#16161a,#cda349)',
  'sunflower-mustard': 'linear-gradient(135deg,#d49a2a,#f7ebc8)',
  'beige-korean': 'linear-gradient(135deg,#a89a86,#e8dfd2)',
  'rose-gold': 'linear-gradient(135deg,#c98a76,#e6b9a8)',
  'mono-editorial': 'linear-gradient(135deg,#111111,#bbbbbb)',
  'royal-purple': 'linear-gradient(135deg,#46276b,#cba35a)',
  'marble-white': 'linear-gradient(135deg,#d8d2c6,#c2a35e)',
  'celestial-cinematic': 'linear-gradient(135deg,#1b234e,#d8c074)',
}

function statusBadge(it) {
  if (it.is_active) return <span className="mi-badge active">Aktif</span>
  if (it.activation_requested) return <span className="mi-badge req">Menunggu Aktivasi</span>
  return <span className="mi-badge draft">Draft</span>
}

export default function MyInvitationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [max, setMax] = useState(1)

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/dashboard'); return }
    api.get('/my/invitations/')
      .then(res => { setItems(res.data.invitations || []); setMax(res.data.max_invitations || 1) })
      .catch(err => {
        if (err.response?.status === 401) navigate('/dashboard')
        else setItems([])
      })
  }, [navigate])

  function logout() {
    localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/dashboard')
  }

  if (items === null) {
    return <div className="mi" style={{ display: 'grid', placeItems: 'center' }}><p style={{ color: '#8a7f74', padding: '4rem' }}>Memuat…</p></div>
  }

  return (
    <div className="mi">
      <div className="mi-bar">
        <Link to="/" className="mi-brand" style={{ textDecoration: 'none' }}>
          <span className="mi-brand-mark">D</span><span>Dear<em>Guest</em></span>
        </Link>
        <div className="mi-bar-actions">
          <button className="mi-mini dark" onClick={logout}>Keluar</button>
        </div>
      </div>

      <div className="mi-body">
        <div className="mi-head">
          <div>
            <h1>Undangan Saya</h1>
            <p>{items.length} dari {max} undangan terpakai.</p>
          </div>
          {items.length < max ? (
            <Link to="/onboarding" className="mi-btn">+ Buat Undangan Baru</Link>
          ) : (
            <a
              className="mi-mini"
              style={{ background: '#25d366', color: '#fff', borderColor: '#25d366' }}
              href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Halo admin, saya ingin upgrade ke paket Bisnis (2 undangan).')}`}
              target="_blank" rel="noopener noreferrer"
            >
              Upgrade ke Bisnis untuk undangan ke-2
            </a>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mi-empty">
            <p>Kamu belum punya undangan. Yuk buat undangan pertamamu!</p>
            <Link to="/onboarding" className="mi-btn">+ Buat Undangan</Link>
          </div>
        ) : (
          <div className="mi-grid">
            {items.map(it => {
              const names = (it.bride_name || it.groom_name) ? `${it.bride_name || '—'} & ${it.groom_name || '—'}` : it.slug
              return (
                <div className="mi-card" key={it.slug}>
                  <div className="mi-card-top" style={{ background: THEME_SWATCH[it.theme] || '#1a1208' }}>
                    <div className="mi-card-names">{names}</div>
                  </div>
                  <div className="mi-card-body">
                    <div className="mi-card-meta">
                      {THEME_NAME[it.theme] || it.theme}
                      {it.wedding_date ? ` · ${format(new Date(it.wedding_date), 'd MMM yyyy', { locale: id })}` : ''}
                      {it.tier && it.tier !== 'free' ? ` · ${it.tier === 'bisnis' ? 'Bisnis' : 'Premium'}` : ''}
                    </div>
                    {statusBadge(it)}
                    <div className="mi-card-actions">
                      <Link className="mi-mini" to={`/dashboard/${it.slug}/edit`}>Edit</Link>
                      <a className="mi-mini" href={`/${it.slug}`} target="_blank" rel="noopener noreferrer">Pratinjau ↗</a>
                      <Link className="mi-mini" to={`/dashboard/${it.slug}`}>RSVP</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
