import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { formatDateOnly } from '../utils/dates.js'
import api from '../api/client.js'
import { logout as logoutSession } from '../api/session.js'
import { getTheme, themeName } from '../themes/registry.js'
import { Icon } from '../brand/icons.jsx'
import { waLink } from '../brand/site.js'
import '../brand/brand.css'
import './MyInvitations.css'

function statusBadge(it) {
  if (it.is_active) return <span className="mi-badge active">Aktif</span>
  if (it.activation_requested) return <span className="mi-badge req">Menunggu aktivasi</span>
  return <span className="mi-badge draft">Draft</span>
}

// The couple's hub: each invitation with its real cover, how ready it is,
// and one button to the next step.
function InvitationCard({ it }) {
  const names = (it.bride_name || it.groom_name) ? `${it.bride_name || '…'} & ${it.groom_name || '…'}` : it.slug
  const cover = getTheme(it.theme)?.previewImage
  const steps = it.progress || []
  const done = steps.filter(s => s.done).length
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0
  const next = steps.find(s => !s.done)

  return (
    <article className="mi-card">
      <div className="mi-card-main">
        {cover ? <img className="mi-cover" src={cover} alt="" /> : <div className="mi-cover" />}
        <div className="mi-card-text">
          <h2>{names}</h2>
          <p className="mi-card-meta">
            {themeName(it.theme)}
            {it.wedding_date ? ` · ${formatDateOnly(it.wedding_date, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            {it.tier && it.tier !== 'free' ? ` · ${it.tier === 'bisnis' ? 'Bisnis' : 'Premium'}` : ''}
          </p>
          {statusBadge(it)}
        </div>
      </div>

      {steps.length > 0 && (
        <div className="mi-progress">
          <div className="mi-progress-head">
            <b className="dg-num">{pct}% siap</b>
            <span>{next ? `Berikutnya: ${next.label.toLowerCase()}` : 'Semua siap. Saatnya dikirim.'}</span>
          </div>
          <div className="mi-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Kesiapan undangan">
            <i style={{ width: `${pct}%` }} />
          </div>
          <ul className="mi-steps">
            {steps.map(s => <li key={s.key} className={s.done ? 'ok' : ''}>{s.done ? Icon.check : <span className="mi-dot" />}{s.label}</li>)}
          </ul>
        </div>
      )}

      <div className="mi-card-actions">
        <Link className="dg-btn dg-btn-ink dg-btn-sm" to={`/dashboard/${it.slug}/edit`}>{next && next.key !== 'guests' ? 'Lanjutkan mengisi' : 'Buka editor'}</Link>
        <Link className="dg-btn dg-btn-line dg-btn-sm" to={`/dashboard/${it.slug}`}>Tamu &amp; RSVP</Link>
        <a className="dg-btn dg-btn-line dg-btn-sm" href={`/${it.slug}`} target="_blank" rel="noopener noreferrer">Lihat {Icon.external}</a>
      </div>
    </article>
  )
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

  return (
    <div className="dg mi">
      <header className="mi-topbar dg-dark">
        <div className="dg-container mi-topbar-inner">
          <Link to="/" className="dg-brand">Dear<i>Guest</i></Link>
          <div className="mi-topbar-actions">
            <Link to="/tema" className="mi-toplink">Galeri tema</Link>
            <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={logout}>Keluar</button>
          </div>
        </div>
      </header>

      <main className="dg-container mi-body">
        {items === null ? (
          <p className="dg-small mi-loading">Memuat…</p>
        ) : (
          <>
            <div className="mi-head">
              <div>
                <p className="dg-eyebrow">Undangan saya</p>
                <h1 className="dg-h2">{items.length ? <>Selamat datang <em>kembali</em>.</> : <>Mari mulai <em>undangan kalian</em>.</>}</h1>
                {items.length > 0 && <p className="dg-small">{items.length} dari {max} undangan terpakai.</p>}
              </div>
              {items.length > 0 && (items.length < max ? (
                <Link to="/onboarding" className="dg-btn dg-btn-line">{Icon.plus} Undangan baru</Link>
              ) : (
                <a className="dg-btn dg-btn-wa" target="_blank" rel="noopener noreferrer"
                  href={waLink('Halo admin, saya ingin upgrade ke paket Bisnis (2 undangan).')}>
                  {Icon.whatsapp} Upgrade ke Bisnis untuk undangan ke-2
                </a>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="mi-empty">
                <p>Pilih tema, isi nama dan tanggal. Semuanya bisa diubah nanti.</p>
                <div className="mi-empty-actions">
                  <Link to="/onboarding" className="dg-btn dg-btn-ink">Buat undangan</Link>
                  <Link to="/tema" className="dg-btn dg-btn-line">Lihat tema dulu</Link>
                </div>
              </div>
            ) : (
              <div className="mi-grid">
                {items.map(it => <InvitationCard key={it.slug} it={it} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
