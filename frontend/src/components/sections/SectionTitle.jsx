import { motion, useReducedMotion } from 'framer-motion'
import { usePack } from '../../themes/packs/_system/ThemeContext.jsx'
import ThemeAsset from '../../themes/packs/_system/ThemeAsset.jsx'
import { titleReveal } from '../../themes/packs/_system/motion.js'

// Section heading. Legacy themes get exactly the old <h2>; theme packs also
// get their `heading-ornament` slot under it, and reveal both on scroll: the
// title rises out of a mask, then the ornament draws from its centre
// (themes/packs/_system/motion.js).
export default function SectionTitle({ children }) {
  const pack = usePack()
  const still = useReducedMotion()
  if (!pack) return <h2 className="section-title">{children}</h2>
  const v = titleReveal(still)
  return (
    <motion.div className="pk-title" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
      <motion.h2 className="section-title" variants={v.title}>{children}</motion.h2>
      <motion.div className="pk-ornament-reveal" variants={v.ornament}>
        <ThemeAsset slot="heading-ornament" className="pk-heading-ornament" />
      </motion.div>
    </motion.div>
  )
}
