import { lazy, Suspense } from 'react'
import CoverGate from '../components/ui/CoverGate.jsx'

// Each theme (and its CSS) is a separate chunk — an invitation loads only
// the one theme it uses.
const themes = {
  'javanese-dark': lazy(() => import('./JavaneseDark/index.jsx')),
  'floral-light': lazy(() => import('./FloralLight/index.jsx')),
  'modern-minimalist': lazy(() => import('./ModernMinimalist/index.jsx')),
  'luxury-emerald': lazy(() => import('./LuxuryEmerald/index.jsx')),
  'rustic-kraft': lazy(() => import('./RusticKraft/index.jsx')),
  'boho-terracotta': lazy(() => import('./BohoTerracotta/index.jsx')),
}

export default function ThemeRenderer({ invitation, guestName }) {
  const themeKey = themes[invitation.theme] ? invitation.theme : 'javanese-dark'
  const Theme = themes[themeKey]

  return (
    <>
      <CoverGate invitation={invitation} guestName={guestName} themeClass={themeKey} />
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Theme invitation={invitation} guestName={guestName} />
      </Suspense>
    </>
  )
}
