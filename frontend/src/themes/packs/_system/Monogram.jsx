import ThemeAsset from './ThemeAsset.jsx'
import { usePack } from './ThemeContext.jsx'

const initial = name => (name || '').trim().charAt(0).toUpperCase()

// The couple's initials inside the pack's `monogram-frame` slot (cover,
// between the profiles, closing). A painted `monogram-wreath` (prompts/sections)
// takes the frame's place. Without either the initials stand alone.
export default function Monogram({ couple, className = '' }) {
  const wreath = Boolean(usePack()?.pack.manifest.slots?.['monogram-wreath'])
  const a = initial(couple?.bride_name)
  const b = initial(couple?.groom_name)
  if (!a && !b) return null
  return (
    <div className={`pk-monogram${wreath ? ' pk-monogram--wreath' : ''} ${className}`.trim()} aria-hidden="true">
      {wreath
        ? <ThemeAsset slot="monogram-wreath" className="pk-monogram-wreath" />
        : <ThemeAsset slot="monogram-frame" className="pk-monogram-frame" />}
      <span className="pk-monogram-initials">
        {a}<span className="pk-monogram-amp">&amp;</span>{b}
      </span>
    </div>
  )
}
