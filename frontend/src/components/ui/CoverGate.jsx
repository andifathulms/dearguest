import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useMotionClock } from '../../motion/MotionClockContext.jsx'

/**
 * Full-screen "Buka Undangan" opening gate shown over every theme.
 * - Locks page scroll until the guest opens the invitation.
 * - On open, dispatches `invitation:open` so the MusicPlayer can start
 *   audio within the user gesture (browser autoplay policy).
 * - When the theme provides a shared motion clock, the card registers itself
 *   as a driven target and its reveal is choreographed against that clock. The
 *   card's markup and styling are identical either way, so reduced-motion
 *   guests lose the motion, not the design.
 */
export default function CoverGate({ invitation, guestName, themeClass }) {
  const [open, setOpen] = useState(false)
  // 'pending' → waiting on the lazy motion chunk; 'driven' → the frame clock
  // owns the card; 'css' → gave up waiting, the theme's own animation runs.
  const [reveal, setReveal] = useState('pending')
  const clock = useMotionClock()
  const openBtnRef = useRef(null)
  const cardRef = useRef(null)
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

  // No clock means this theme has no motion layer, or the guest asked for
  // reduced motion (see MotionClockProvider in ThemeRenderer).
  const useBackdrop = Boolean(clock)

  const onRevealStart = useCallback(() => setReveal('driven'), [])

  // Hand the card to the shared clock. Registered directly rather than through
  // useMotionTarget because the driver needs a callback, which cannot be part
  // of the serialised options key.
  useEffect(() => {
    if (!useBackdrop || !cardRef.current) return
    return clock.addTarget({
      kind: 'cover',
      node: cardRef.current,
      options: { onStart: onRevealStart },
    })
  }, [clock, useBackdrop, onRevealStart])

  // If the chunk never loads or the clock never starts, fall back to the
  // theme's own CSS entrance rather than leaving the card hidden forever.
  useEffect(() => {
    if (!useBackdrop || reveal !== 'pending') return
    const t = setTimeout(() => setReveal(r => (r === 'pending' ? 'css' : r)), 1500)
    return () => clearTimeout(t)
  }, [useBackdrop, reveal])

  function handleOpen() {
    document.body.classList.remove('cover-open')
    // Start the background music inside the click gesture.
    window.dispatchEvent(new Event('invitation:open'))
    setOpen(true)
  }

  const openButton = (
    <button className="cover-open-btn" onClick={handleOpen} ref={openBtnRef}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5h16v14H4z" />
        <path d="M4 7l8 6 8-6" />
      </svg>
      <span>Buka Undangan</span>
    </button>
  )

  // Identical markup on both paths — only who animates it differs.
  const cardContent = (
    <>
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

      {openButton}
    </>
  )

  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          className={`cover-gate ${themeClass}${useBackdrop ? ' cover-gate--backdrop' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Pembuka undangan"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30, transition: { duration: 0.8, ease: 'easeInOut' } }}
        >
          <div className="cover-ornaments" aria-hidden="true" />

          {useBackdrop ? (
            // Plain div: the reveal is written onto these elements each frame by
            // useCoverReveal, so Framer Motion must not fight it for the same
            // inline styles. Hidden until the driver takes over.
            <div
              ref={cardRef}
              className={`cover-inner${reveal === 'driven' ? ' cover-inner--driven' : ''}`}
              style={reveal === 'pending' ? { opacity: 0 } : undefined}
            >
              {cardContent}
            </div>
          ) : (
            <motion.div
              className="cover-inner"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {cardContent}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
