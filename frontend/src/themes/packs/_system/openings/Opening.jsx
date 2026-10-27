import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePack } from '../ThemeContext.jsx'
import { useOpeningGate, devOpeningOverrides } from './useOpeningGate.js'

// Player-backed openings load only when a pack uses them.
const LottieLayer = lazy(() => import('./LottieLayer.jsx'))
const LayeredSvgLayer = lazy(() => import('./LayeredSvgLayer.jsx'))

const DEFAULT_DURATION = 1600

// The cover gate for packs. theme.json → opening: { type, preset, durationMs }.
//   none         static cover
//   css          the cover's own elements animate by `preset` (_base/openings.css)
//   lottie       the `opening` slot's Lottie file plays behind the cover content
//   layered-svg  named layers of the `opening` slot's SVG animate by `preset`
// The intro plays once; a tap or key skips it to the end state; reduced motion
// shows the end state at once. The open button (end state) opens the invitation.
export default function Opening({ Cover, invitation, guestName }) {
  const { pack } = usePack()
  const dev = devOpeningOverrides()
  const opening = pack.manifest.opening || {}
  const type = dev.type || opening.type || 'none'
  const duration = opening.durationMs || DEFAULT_DURATION
  const pinnedAt = dev.pinnedAt ?? null
  const reduced = useReducedMotion()
  const { opened, open, buttonRef } = useOpeningGate()
  const [done, setDone] = useState(type === 'none')

  const finished = done || reduced
  useEffect(() => {
    if (finished || pinnedAt !== null || type === 'lottie') return undefined
    const t = setTimeout(() => setDone(true), duration)
    return () => clearTimeout(t)
  }, [finished, pinnedAt, type, duration])

  function skip() {
    if (!finished && pinnedAt === null) setDone(true)
  }

  const slot = pack.manifest.slots?.opening
  const src = dev.src || (slot && (pack.urls[slot.lottie] || pack.svgs[slot.svg]))

  return (
    <AnimatePresence>
      {!opened && (
        <motion.div
          className="pk-opening"
          role="dialog"
          aria-modal="true"
          aria-label="Pembuka undangan"
          data-opening={type}
          data-opening-preset={opening.preset}
          data-state={finished ? 'done' : 'playing'}
          data-pinned={pinnedAt !== null ? '' : undefined}
          style={{ '--op-dur': `${duration}ms`, '--op-t': `${(pinnedAt ?? 0) * duration}ms` }}
          onPointerDown={skip}
          onKeyDown={skip}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } }}
        >
          {type === 'lottie' && src && (
            <Suspense fallback={null}>
              <LottieLayer src={src} pinnedAt={pinnedAt} finished={finished} onComplete={() => setDone(true)} />
            </Suspense>
          )}
          {type === 'layered-svg' && src && (
            <Suspense fallback={null}>
              <LayeredSvgLayer svg={src} preset={opening.preset} duration={duration} pinnedAt={pinnedAt} finished={finished} />
            </Suspense>
          )}
          <Cover
            invitation={invitation}
            guestName={guestName}
            openButton={(
              <button className="pk-open-btn cover-open-btn" type="button" onClick={open} ref={buttonRef}>
                Buka Undangan
              </button>
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
