import JavaneseDark from './JavaneseDark/index.jsx'
import FloralLight from './FloralLight/index.jsx'
import ModernMinimalist from './ModernMinimalist/index.jsx'
import LuxuryEmerald from './LuxuryEmerald/index.jsx'
import RusticKraft from './RusticKraft/index.jsx'
import BohoTerracotta from './BohoTerracotta/index.jsx'
import CoverGate from '../components/ui/CoverGate.jsx'

const themes = {
  'javanese-dark': JavaneseDark,
  'floral-light': FloralLight,
  'modern-minimalist': ModernMinimalist,
  'luxury-emerald': LuxuryEmerald,
  'rustic-kraft': RusticKraft,
  'boho-terracotta': BohoTerracotta,
}

export default function ThemeRenderer({ invitation, guestName }) {
  const themeKey = themes[invitation.theme] ? invitation.theme : 'javanese-dark'
  const Theme = themes[themeKey]

  return (
    <>
      <CoverGate invitation={invitation} guestName={guestName} themeClass={themeKey} />
      <Theme invitation={invitation} guestName={guestName} />
    </>
  )
}
