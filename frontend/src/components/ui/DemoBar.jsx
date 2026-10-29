import { useEffect, useState } from 'react'
import { rememberTheme } from '../../utils/themeChoice.js'
import './DemoBar.css'

// Shown on a theme's demo invitation when it was opened from /tema/:id
// ("Buka demo layar penuh", ?from=tema), so the visitor always has a way back
// to ordering. Loaded lazily: real invitations never download it. System
// fonts only, so it doesn't pull the brand faces into the invitation.
export default function DemoBar({ theme }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [])
  return (
    <aside className="demo-bar" data-show={show} aria-label="Contoh tema">
      <span className="demo-bar-text">Contoh tema <b>{theme.name}</b></span>
      <a className="demo-bar-btn" href={`/register?theme=${theme.id}`} onClick={() => rememberTheme(theme.id)}>Pakai tema ini</a>
      <a className="demo-bar-link" href={`/tema/${theme.id}`}>Kembali</a>
    </aside>
  )
}
