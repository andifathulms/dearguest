import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Full-screen "Buka Undangan" opening gate shown over every theme.
 * - Locks page scroll until the guest opens the invitation.
 * - On open, dispatches `invitation:open` so the MusicPlayer can start
 *   audio within the user gesture (browser autoplay policy).
 */
export default function CoverGate({ invitation, guestName, themeClass }) {
  const [open, setOpen] = useState(false)
  const openBtnRef = useRef(null)
  const couple = invitation.couple || {}

  const dateStr = invitation.wedding_date
    ? format(new Date(invitation.wedding_date), 'EEEE, d MMMM yyyy', { locale: id })
    : ''

  // Lock scroll while the gate is showing, and move focus to the open button.
  useEffect(() => {
    document.body.classList.add('cover-open')
    openBtnRef.current?.focus()
    return () => document.body.classList.remove('cover-open')
  }, [])

  function handleOpen() {
    document.body.classList.remove('cover-open')
    // Start the background music inside the click gesture.
    window.dispatchEvent(new Event('invitation:open'))
    setOpen(true)
  }

  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          className={`cover-gate ${themeClass}`}
          role="dialog"
          aria-modal="true"
          aria-label="Pembuka undangan"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30, transition: { duration: 0.8, ease: 'easeInOut' } }}
        >
          <div className="cover-ornaments" aria-hidden="true" />

          <motion.div
            className="cover-inner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <p className="cover-label">The Wedding Of</p>

            <h1 className="cover-names">
              <span className="cover-name-bride">{couple.bride_name}</span>
              <span className="cover-amp">&amp;</span>
              <span className="cover-name-groom">{couple.groom_name}</span>
            </h1>

            {dateStr && <p className="cover-date">{dateStr}</p>}

            <div className="cover-divider" aria-hidden="true" />

            <div className="cover-guest">
              <p className="cover-guest-to">Kepada Yth. Bapak/Ibu/Saudara/i</p>
              <p className="cover-guest-name">{guestName || 'Tamu Undangan'}</p>
            </div>

            <button className="cover-open-btn" onClick={handleOpen} ref={openBtnRef}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16v14H4z" />
                <path d="M4 7l8 6 8-6" />
              </svg>
              <span>Buka Undangan</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
