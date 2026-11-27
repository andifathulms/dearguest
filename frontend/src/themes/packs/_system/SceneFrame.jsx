import { motion } from 'framer-motion'
import { usePack } from './ThemeContext.jsx'
import ThemeAsset from './ThemeAsset.jsx'

// A scene painting with content set in its calm area (the `scene-interlude` and
// `closing-scene` slots, prompts/scenes; docs/theme-packs.md §4, §9). The slot's
// `calm` is that area as fractions of the painting: [x0, y0, x1, y1]. The
// painting settles from a slight zoom as it comes into view. For a pack without
// the slot this renders its children alone, so the markup is what it always was.
export default function SceneFrame({ slot, children }) {
  const spec = usePack()?.pack.manifest.slots?.[slot]
  if (!spec) return children
  const [x0, y0, x1, y1] = spec.calm || [0, 0, 1, 1]
  return (
    <div
      className={`pk-scene pk-scene--${slot}`}
      data-narrow={x1 - x0 < 0.6 ? '' : undefined}
      style={{ '--scene-ratio': spec.width / spec.height, '--calm-x': x0, '--calm-y': y0, '--calm-w': x1 - x0, '--calm-h': y1 - y0 }}
    >
      <motion.div
        className="pk-scene-art"
        initial={{ opacity: 0, scale: 1.06 }}
        whileInView={{ opacity: 1, scale: 1, transitionEnd: { transform: 'none' } }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <ThemeAsset slot={slot} />
      </motion.div>
      <div className="pk-scene-calm">{children}</div>
    </div>
  )
}
