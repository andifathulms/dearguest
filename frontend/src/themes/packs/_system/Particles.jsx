import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'
import { usePack } from './ThemeContext.jsx'

// Falling sprites (petals, jasmine…) from slots.particles: { frames: [...], count, size }.
// CSS fall animation, fixed behind nothing that can be clicked; hidden under
// reduced motion (_base/base.css). Positions come from a fixed sequence, so
// every render (and every screenshot) is the same. Scrolling blows them like
// wind: the layer lifts and leans against the scroll's (smoothed) velocity and
// settles back when the page stops (zero at rest, so screenshots don't move).
const seq = (i, n) => {
  const x = Math.sin((i + 1) * n) * 43758.5453
  return x - Math.floor(x)
}

export default function Particles() {
  const ctx = usePack()
  const spec = ctx?.pack.manifest.slots?.particles
  if (!spec?.frames?.length) return null
  return <ParticleField spec={spec} urls={ctx.pack.urls} />
}

function ParticleField({ spec, urls }) {
  const { scrollY } = useScroll()
  const wind = useSpring(useVelocity(scrollY), { stiffness: 90, damping: 30 })
  const y = useTransform(wind, [-3000, 0, 3000], [110, 0, -110], { clamp: true })
  const skewY = useTransform(wind, [-3000, 0, 3000], [-6, 0, 6], { clamp: true })
  const size = spec.size || 28
  return (
    <div className="pk-particles" aria-hidden="true">
      <motion.div className="pk-particles-wind" style={{ y, skewY }}>
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
      </motion.div>
    </div>
  )
}
