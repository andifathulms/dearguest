import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { formatDateOnly } from '../utils/dates.js'
import api from '../api/client.js'
import { logout as logoutSession } from '../api/session.js'
import { themeName, themeSwatch } from '../themes/registry.js'
import './MyInvitations.css'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '628123456789'

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
    api.get('/my/invitations/')
      .then(res => { setItems(res.data.invitations || []); setMax(res.data.max_invitations || 1) })
      .catch(err => {
        if (err.response?.status === 401) navigate('/dashboard')
        else setItems([])
      })
  }, [navigate])

  const logout = () => logoutSession(navigate)

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
                  <div className="mi-card-top" style={{ background: themeSwatch(it.theme) }}>
                    <div className="mi-card-names">{names}</div>
                  </div>
                  <div className="mi-card-body">
                    <div className="mi-card-meta">
                      {themeName(it.theme)}
                      {it.wedding_date ? ` · ${formatDateOnly(it.wedding_date, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
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
