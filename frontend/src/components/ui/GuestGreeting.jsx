import { motion } from 'framer-motion'
import { useCopy } from '../../copy/CopyContext.jsx'
import { seatLabel } from '../../utils/seat.js'

// `seat`: the guest's table, only on their own link when the couple set one.
export default function GuestGreeting({ guestName, openingText, seat }) {
  const { t } = useCopy()
  return (
    <motion.section
      className="greeting-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      {guestName && (
        <p className="greeting-to">
          {t('greeting.to')} <strong>{guestName}</strong>
        </p>
      )}
      {guestName && seat && (
        <p className="greeting-to greeting-seat">
          {t('greeting.seat')} <strong>{seatLabel(seat)}</strong>
        </p>
      )}
      {openingText && <p className="greeting-text">{openingText}</p>}
    </motion.section>
  )
}
