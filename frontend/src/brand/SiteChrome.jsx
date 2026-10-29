import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSession } from '../api/session.js'
import { Icon } from './icons.jsx'
import { NAV, WA_HELP } from './site.js'

// Header for every marketing page. `tone="light"` sits on porcelain pages;
// the default is the dark "malam" stage. A logged-in couple sees "Undangan
// Saya" instead of "Masuk" / "Buat Undangan".
export function SiteNav({ tone = 'dark' }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const session = useSession()
  useEffect(() => setOpen(false), [pathname])

  const primary = session
    ? { to: '/my', label: 'Undangan Saya' }
    : { to: '/register', label: 'Buat Undangan' }

  return (
    <header className={`dg-nav ${tone === 'light' ? 'light' : ''}`}>
      <div className="dg-container dg-nav-inner">
        <Link to="/" className="dg-brand" aria-label="DearGuest, beranda">Dear<i>Guest</i></Link>
        <nav className="dg-nav-links" aria-label="Menu utama">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} aria-current={pathname === n.to ? 'page' : undefined}>{n.label}</Link>
          ))}
        </nav>
        <div className="dg-nav-right">
          {!session && <Link to="/dashboard" className="dg-login">Masuk</Link>}
          <Link to={primary.to} className={`dg-btn dg-btn-sm ${tone === 'light' ? 'dg-btn-ink' : 'dg-btn-gold'}`}>{primary.label}</Link>
          <button type="button" className="dg-menu-btn" aria-expanded={open} aria-controls="dg-menu"
            aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(o => !o)}>
            {open ? Icon.close : Icon.menu}
          </button>
        </div>
      </div>
      <div id="dg-menu" className="dg-menu" data-open={open}>
        {NAV.map(n => <Link key={n.to} to={n.to}>{n.label}</Link>)}
        {session ? <Link to="/my">Undangan Saya</Link> : <Link to="/dashboard">Masuk</Link>}
        <Link to={primary.to} className={`dg-btn ${tone === 'light' ? 'dg-btn-ink' : 'dg-btn-gold'}`}>{primary.label}</Link>
      </div>
    </header>
  )
}

// Phone-only bar that slides in once the visitor scrolls past the first
// screen: the next step stays one thumb away.
export function StickyBar({ primary = { to: '/register', label: 'Buat Undangan' }, secondary }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const second = secondary || { href: WA_HELP, label: 'Tanya Admin' }
  return (
    <div className="dg-sticky" data-show={show} aria-hidden={!show}>
      <div className="dg-sticky-inner">
        {second.to
          ? <Link to={second.to} className="dg-btn dg-btn-line" tabIndex={show ? 0 : -1}>{second.label}</Link>
          : <a href={second.href} target="_blank" rel="noopener noreferrer" className="dg-btn dg-btn-wa" tabIndex={show ? 0 : -1}>{Icon.whatsapp}{second.label}</a>}
        <Link to={primary.to} className="dg-btn dg-btn-ink" tabIndex={show ? 0 : -1}>{primary.label}</Link>
      </div>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="dg-footer">
      <div className="dg-container">
        <div className="dg-footer-grid">
          <div>
            <Link to="/" className="dg-brand">Dear<i>Guest</i></Link>
            <p>Undangan pernikahan digital berlukis untuk pasangan Indonesia. Satu tautan untuk semua tamu.</p>
          </div>
          <div>
            <h4>Jelajahi</h4>
            <ul>
              <li><Link to="/tema">Galeri tema</Link></li>
              <li><Link to="/#cara-kerja">Cara kerja</Link></li>
              <li><Link to="/#harga">Harga</Link></li>
              <li><Link to="/#faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4>Akun</h4>
            <ul>
              <li><Link to="/register">Buat undangan</Link></li>
              <li><Link to="/dashboard">Masuk</Link></li>
              <li><a href={WA_HELP} target="_blank" rel="noopener noreferrer">Tanya admin via WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="dg-footer-base">
          <span>© {new Date().getFullYear()} DearGuest</span>
          <span>Undangan pernikahan digital</span>
        </div>
      </div>
    </footer>
  )
}

// Hash links (/#harga) from a client-side navigation: scroll once the target exists.
export function useHashScroll() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    let tries = 0
    const t = setInterval(() => {
      const el = document.getElementById(id)
      if (el || ++tries > 20) {
        clearInterval(t)
        el?.scrollIntoView({ block: 'start' })
      }
    }, 50)
    return () => clearInterval(t)
  }, [hash, pathname])
}
