import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { usePack } from './ThemeContext.jsx'
import ThemeAsset from './ThemeAsset.jsx'

// A section's prop (the `prop-1` … `prop-4` slots, prompts/scenes): one painted
// object in the corner the side spray leaves free. It moves ahead of the scroll
// and turns a little, so it reads as nearer than the cards: at rest (the section
// centred in the viewport) it is level and in place. Per-section screenshots pin
// it there (tests/visual/packs/sections.css). Renders nothing for a pack
// without the slot.
export default function SectionProp({ slot, side }) {
  const ref = useRef(null)
  const still = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['7vh', '-7vh'])
  const turn = side === 'left' ? -1 : 1
  const rotate = useTransform(scrollYProgress, [0, 1], [5 * turn, -5 * turn])
  const { pack } = usePack()
  if (!pack.manifest.slots?.[slot]) return null
  return (
    <motion.div ref={ref} className="pk-section-prop" data-side={side} style={still ? undefined : { y, rotate }}>
      <ThemeAsset slot={slot} />
    </motion.div>
  )
}
