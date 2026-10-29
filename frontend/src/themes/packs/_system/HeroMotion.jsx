import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { usePack } from './ThemeContext.jsx'
import ThemeAsset from './ThemeAsset.jsx'

// The hero "curtain" (docs/theme-packs.md §9): as the guest scrolls past the
// hero, the top band rises, the bottom band sinks, the painting behind drifts
// slower than the page and the portrait tilts back. Progress runs 0 → 1 from
// the top of the page until the hero has scrolled away, so at rest (scrollY 0,
// and every hero screenshot) every value is the identity and Framer writes
// transform: none. Under reduced motion nothing moves.
export function useHeroScroll(ref) {
  const still = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const top = useTransform(scrollYProgress, [0, 1], ['0%', '-24%'])
  const bottom = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const bg = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const tilt = useTransform(scrollYProgress, [0, 1], [0, 16])
  const sink = useTransform(scrollYProgress, [0, 1], [1, 0.9])
  if (still) return { still, progress: scrollYProgress }
  return {
    still,
    progress: scrollYProgress,
    top: { y: top },
    bottom: { y: bottom },
    bg: { y: bg },
    portrait: { rotateX: tilt, scale: sink },   // perspective comes from .hero-content (motion.css), so at rest this is transform: none
  }
}

// Default lag per depth layer: how far it trails the scroll (0 = moves with
// the page, 1 = stands still; negative = moves ahead, i.e. nearer than the text).
const DEPTH = { 'parallax-back': 0.4, 'parallax-mid': 0.2, 'parallax-front': -0.15 }

// A parallax-* slot moving at its `depth` (theme.json). Renders nothing for an
// empty slot, so packs without depth art are unaffected. The offset is in vh
// (the hero is about a screen tall), not % of the layer, so a thin strip (a lake
// placed by the pack's CSS) trails the scroll as much as a full-frame layer.
export function ParallaxLayer({ slot, motionState }) {
  const { pack } = usePack()
  const spec = pack.manifest.slots?.[slot]
  const depth = spec?.depth ?? DEPTH[slot]
  const y = useTransform(motionState.progress, v => `${(v * depth * 100).toFixed(2)}vh`)
  if (!spec) return null
  return (
    <motion.div className={`pk-parallax pk-${slot}`} style={motionState.still ? undefined : { y }}>
      <ThemeAsset slot={slot} />
    </motion.div>
  )
}
