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
  'burgundy-gold': lazy(() => import('./BurgundyGold/index.jsx')),
  'dusty-blue': lazy(() => import('./DustyBlue/index.jsx')),
  'midnight-celestial': lazy(() => import('./MidnightCelestial/index.jsx')),
}

export default function ThemeRenderer({ invitation, guestName, preview = false }) {
  const themeKey = themes[invitation.theme] ? invitation.theme : 'javanese-dark'
  const Theme = themes[themeKey]

  return (
    <>
      {/* Editor preview renders the content directly, skipping the cover gate. */}
      {!preview && <CoverGate invitation={invitation} guestName={guestName} themeClass={themeKey} />}
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Theme invitation={invitation} guestName={guestName} />
      </Suspense>
    </>
  )
}
