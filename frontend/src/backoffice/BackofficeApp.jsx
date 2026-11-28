import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import AuthShell from '../brand/AuthShell.jsx'
import { Icon } from '../brand/icons.jsx'
import Logo from '../brand/Logo.jsx'
import { MeContext, SIGNED_OUT, errorText, staffGet, staffPost } from './ui.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import ActivityPage from './pages/ActivityPage.jsx'
import ActivationsPage from './pages/ActivationsPage.jsx'
import WatchPage from './pages/WatchPage.jsx'
import InvitationsPage from './pages/InvitationsPage.jsx'
import InvitationDetailPage from './pages/InvitationDetailPage.jsx'
import CouplesPage from './pages/CouplesPage.jsx'
import WishesPage from './pages/WishesPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import ThemesPage from './pages/ThemesPage.jsx'
import GrowthPage from './pages/GrowthPage.jsx'
import RevenuePage from './pages/RevenuePage.jsx'
import SystemPage from './pages/SystemPage.jsx'
import VouchersPage from './pages/VouchersPage.jsx'
import VoucherDetailPage from './pages/VoucherDetailPage.jsx'
import ArticlesPage from './pages/ArticlesPage.jsx'
import ArticleEditorPage from './pages/ArticleEditorPage.jsx'
import '../brand/brand.css'
import '../pages/Auth.css'
import '../pages/blog/Blog.css'
import './Backoffice.css'

// The backoffice: Vowvella's own operator app at /backoffice, for the owner
// and staff (the Django admin is separate). Staff sign in with password and
// authenticator code; the API is /api/staff/ (backend staff_views.py).

// Sidebar sections. `owner` items need the revenue permission.
const NAV = [
  { group: 'Hari ini', items: [
    { to: '/backoffice', label: 'Ringkasan', end: true },
    { to: '/backoffice/aktivasi', label: 'Aktivasi' },
    { to: '/backoffice/hari-h', label: 'Hari H' },
    { to: '/backoffice/aktivitas', label: 'Aktivitas' },
  ] },
  { group: 'Pelanggan', items: [
    { to: '/backoffice/undangan', label: 'Undangan' },
    { to: '/backoffice/pasangan', label: 'Pasangan' },
  ] },
  { group: 'Moderasi', items: [
    { to: '/backoffice/ucapan', label: 'Ucapan' },
    { to: '/backoffice/laporan', label: 'Laporan' },
  ] },
  { group: 'Bisnis', items: [
    { to: '/backoffice/voucher', label: 'Voucher' },
    { to: '/backoffice/artikel', label: 'Artikel' },
    { to: '/backoffice/tema', label: 'Tema' },
    { to: '/backoffice/pertumbuhan', label: 'Pertumbuhan' },
    { to: '/backoffice/pendapatan', label: 'Pendapatan', owner: true },
    { to: '/backoffice/sistem', label: 'Sistem' },
  ] },
]

export default function BackofficeApp() {
  return (
    <div className="dg bo">
      <Routes>
        <Route path="masuk" element={<StaffLogin />} />
        <Route path="*" element={<Shell />} />
      </Routes>
    </div>
  )
}

function StaffLogin() {
  const [form, setForm] = useState({ username: '', password: '', otp: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const next = new URLSearchParams(useLocation().search).get('next')

  useEffect(() => { document.title = 'Masuk · Backoffice Vowvella' }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await staffPost('login/', form)
      navigate(next && next.startsWith('/backoffice') ? next : '/backoffice', { replace: true })
    } catch (err) {
      setError(errorText(err))
      setForm(f => ({ ...f, otp: '' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <p className="dg-eyebrow bo-login-eyebrow">Backoffice</p>
        <h1>Masuk untuk tim Vowvella</h1>
        <p className="auth-sub">Khusus pemilik dan staf. Pasangan masuk lewat <Link to="/dashboard" className="dg-link">halaman ini</Link>.</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="bo-username">Username</label>
            <input className="auth-input" id="bo-username" name="username" value={form.username} onChange={set}
              required autoComplete="username" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="bo-password">Kata sandi</label>
            <input className="auth-input" id="bo-password" name="password" type="password" value={form.password}
              onChange={set} required autoComplete="current-password" />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="bo-otp">Kode authenticator</label>
            <input className="auth-input bo-otp" id="bo-otp" name="otp" value={form.otp} onChange={set}
              inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="one-time-code" placeholder="6 angka" />
            <p className="auth-hint">Dari aplikasi authenticator yang didaftarkan untuk Vowvella.</p>
          </div>
          <button className="auth-btn" type="submit" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
        </form>
      </div>
    </AuthShell>
  )
}

function Shell() {
  const [me, setMe] = useState(undefined)
  const [menu, setMenu] = useState(false)
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  useEffect(() => {
    staffGet('me/').then(setMe).catch(() => setMe(null))
  }, [])
  useEffect(() => {
    const out = () => setMe(null)
    window.addEventListener(SIGNED_OUT, out)
    return () => window.removeEventListener(SIGNED_OUT, out)
  }, [])
  useEffect(() => setMenu(false), [pathname])

  if (me === undefined) return <p className="bo-boot">Memuat backoffice…</p>
  if (me === null) {
    return <Navigate to={`/backoffice/masuk?next=${encodeURIComponent(pathname + search)}`} replace />
  }

  async function logout() {
    try { await api.post('/auth/logout/') } catch { /* cookies are cleared either way */ }
    navigate('/backoffice/masuk', { replace: true })
  }

  const owner = me.can_see_revenue
  return (
    <MeContext.Provider value={me}>
      <div className="bo-layout">
        <aside className="bo-side dg-dark" data-open={menu}>
          <div className="bo-side-top">
            <Link to="/backoffice" className="dg-brand" aria-label="Backoffice, ringkasan"><Logo /></Link>
            <span className="bo-side-tag">Backoffice</span>
            <button type="button" className="bo-menu-btn" aria-expanded={menu} aria-controls="bo-nav"
              aria-label={menu ? 'Tutup menu' : 'Buka menu'} onClick={() => setMenu(m => !m)}>
              {menu ? Icon.close : Icon.menu}
            </button>
          </div>
          <nav id="bo-nav" className="bo-nav" aria-label="Backoffice">
            {NAV.map(section => (
              <div key={section.group} className="bo-nav-group">
                <p className="bo-nav-title">{section.group}</p>
                {section.items.filter(i => owner || !i.owner).map(i => (
                  <NavLink key={i.to} to={i.to} end={i.end} className="bo-nav-link">{i.label}</NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div className="bo-side-foot">
            <div className="bo-who">
              <span className="bo-who-name">{me.username}</span>
              <span className={`bo-role ${owner ? 'owner' : ''}`}>{me.role === 'owner' ? 'Pemilik' : 'Staf'}</span>
            </div>
            <button type="button" className="bo-logout" onClick={logout}>Keluar</button>
          </div>
        </aside>
        <main className="bo-main">
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="aktivitas" element={<ActivityPage />} />
            <Route path="aktivasi" element={<ActivationsPage />} />
            <Route path="hari-h" element={<WatchPage />} />
            <Route path="undangan" element={<InvitationsPage />} />
            <Route path="undangan/:id" element={<InvitationDetailPage />} />
            <Route path="pasangan" element={<CouplesPage />} />
            <Route path="ucapan" element={<WishesPage />} />
            <Route path="laporan" element={<ReportsPage />} />
            <Route path="voucher" element={<VouchersPage />} />
            <Route path="voucher/:id" element={<VoucherDetailPage />} />
            <Route path="artikel" element={<ArticlesPage />} />
            <Route path="artikel/:id" element={<ArticleEditorPage />} />
            <Route path="tema" element={<ThemesPage />} />
            <Route path="pertumbuhan" element={<GrowthPage />} />
            <Route path="pendapatan" element={owner ? <RevenuePage /> : <Navigate to="/backoffice" replace />} />
            <Route path="sistem" element={<SystemPage />} />
            <Route path="*" element={<Navigate to="/backoffice" replace />} />
          </Routes>
        </main>
      </div>
    </MeContext.Provider>
  )
}
