import { usePack } from './ThemeContext.jsx'

// Falling sprites (petals, jasmine…) from slots.particles: { frames: [...], count, size }.
// CSS-only animation, fixed behind nothing that can be clicked; hidden under
// reduced motion (_base/base.css). Positions come from a fixed sequence, so
// every render (and every screenshot) is the same.
const seq = (i, n) => {
  const x = Math.sin((i + 1) * n) * 43758.5453
  return x - Math.floor(x)
}

export default function Particles() {
  const ctx = usePack()
  const spec = ctx?.pack.manifest.slots?.particles
  if (!spec?.frames?.length) return null
  const { urls } = ctx.pack
  const size = spec.size || 28
  return (
    <div className="pk-particles" aria-hidden="true">
      {Array.from({ length: spec.count || 8 }, (_, i) => (
        <img
          key={i}
          className="pk-particle"
          src={urls[spec.frames[i % spec.frames.length]]}
          alt=""
          width={size}
          height={size}
          style={{
            left: `${(seq(i, 12.9) * 96).toFixed(1)}%`,
            width: `${Math.round(size * (0.7 + seq(i, 78.2) * 0.6))}px`,
            animationDuration: `${(11 + seq(i, 37.7) * 9).toFixed(1)}s`,
            animationDelay: `${(-seq(i, 91.3) * 18).toFixed(1)}s`,
            '--sway': `${Math.round((seq(i, 53.1) - 0.5) * 120)}px`,
            '--spin': `${Math.round(180 + seq(i, 27.4) * 360)}deg`,
          }}
        />
      ))}
    </div>
  )
}
