import JavaneseDark from './JavaneseDark/index.jsx'
import FloralLight from './FloralLight/index.jsx'
import ModernMinimalist from './ModernMinimalist/index.jsx'

const themes = {
  'javanese-dark': JavaneseDark,
  'floral-light': FloralLight,
  'modern-minimalist': ModernMinimalist,
}

export default function ThemeRenderer({ invitation, guestName }) {
  const Theme = themes[invitation.theme] || JavaneseDark
  return <Theme invitation={invitation} guestName={guestName} />
}
