import ThemeAsset from './ThemeAsset.jsx'

const initial = name => (name || '').trim().charAt(0).toUpperCase()

// The couple's initials inside the pack's `monogram-frame` slot (cover,
// between the profiles, closing). Without a frame the initials stand alone.
export default function Monogram({ couple, className = '' }) {
  const a = initial(couple?.bride_name)
  const b = initial(couple?.groom_name)
  if (!a && !b) return null
  return (
    <div className={`pk-monogram ${className}`.trim()} aria-hidden="true">
      <ThemeAsset slot="monogram-frame" className="pk-monogram-frame" />
      <span className="pk-monogram-initials">
        {a}<span className="pk-monogram-amp">&amp;</span>{b}
      </span>
    </div>
  )
}
