import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { usePack } from './ThemeContext.jsx'
import ThemeAsset from './ThemeAsset.jsx'

// A section's side spray (the `section-edge` slot, docs/theme-packs.md §9): the
// painting grows in from one side behind the section's content, the next
// section takes the other side (mirrored). It trails the scroll a little, so
// it reads as farther away than the cards: offset 0 when the section is
// centred in the viewport, ±4vh at its entry and exit. Per-section screenshots
// pin it at 0 (tests/visual/packs/sections.css). Renders nothing for a pack
// without the slot.
export default function SectionEdge({ side }) {
  const ref = useRef(null)
  const still = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-4vh', '4vh'])
  const { pack } = usePack()
  if (!pack.manifest.slots?.['section-edge']) return null
  return (
    <motion.div ref={ref} className="pk-section-edge" data-side={side} style={still ? undefined : { y }}>
      <ThemeAsset slot="section-edge" />
    </motion.div>
  )
}
