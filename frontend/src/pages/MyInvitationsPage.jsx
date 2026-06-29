import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import api from '../api/client.js'
import './MyInvitations.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'

const THEME_NAME = {
  'javanese-dark': 'Javanese Malam Emas',
  'floral-light': 'Taman Bunga',
  'modern-minimalist': 'Minimalis Putih',
  'luxury-emerald': 'Zamrud Mewah',
  'rustic-kraft': 'Rustic Kraft',
  'boho-terracotta': 'Senja Terakota',
  'burgundy-gold': 'Marun Anggun',
  'dusty-blue': 'Biru Senja',
  'midnight-celestial': 'Langit Malam',
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
