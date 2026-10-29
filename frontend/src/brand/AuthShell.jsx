import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { selectableThemes } from '../themes/registry.js'
import { chosenTheme } from '../utils/themeChoice.js'
import './brand.css'
import './AuthShell.css'

const COVERS = selectableThemes().filter(t => t.previewImage)

// Login, register, password reset and onboarding: the form on porcelain, and
// on wide screens a slowly changing cover on the dark stage beside it, so even
// signing in reminds the couple what they're making. If they picked a theme on
// /tema/:id, that cover is shown first.
export default function AuthShell({ children, wide = false }) {
  const [i, setI] = useState(() => {
    const picked = chosenTheme(COVERS.map(t => t.id))
    return Math.max(0, COVERS.findIndex(t => t.id === picked))
  })
  useEffect(() => {
    if (COVERS.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI(n => (n + 1) % COVERS.length), 5000)
    return () => clearInterval(t)
  }, [])
  const cover = COVERS[i]

  return (
    <div className={`dg auth ${wide ? 'auth-is-wide' : ''}`}>
      <aside className="auth-art dg-dark" aria-hidden="true">
        <Link to="/" className="dg-brand" tabIndex={-1}>Dear<i>Guest</i></Link>
        {cover && (
          <div className="auth-art-phone dg-phone">
            <img key={cover.id} src={cover.previewImage} alt="" className="auth-art-img" />
          </div>
        )}
        {cover && <p className="auth-art-cap">Tema <b>{cover.name}</b> · {cover.category}</p>}
      </aside>
      <main className="auth-main">
        <Link to="/" className="dg-brand auth-mobile-brand">Dear<i>Guest</i></Link>
        {children}
      </main>
    </div>
  )
}
