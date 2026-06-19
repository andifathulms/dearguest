import { motion } from 'framer-motion'

export default function GuestGreeting({ guestName, openingText }) {
  return (
    <motion.section
      className="greeting-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      {guestName && (
        <p className="greeting-to">
          Kepada Yth. <strong>{guestName}</strong>
        </p>
      )}
      {openingText && <p className="greeting-text">{openingText}</p>}
    </motion.section>
  )
}
