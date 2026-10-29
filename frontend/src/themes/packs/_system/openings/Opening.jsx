import { lazy, Suspense, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { usePack } from '../ThemeContext.jsx'
import { useOpeningGate, devOpeningOverrides } from './useOpeningGate.js'
import { useCopy } from '../../../../copy/CopyContext.jsx'
import CoverExit from './CoverExit.jsx'

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
// shows the end state at once. The open button (end state) opens the invitation;
// the cover then leaves by the pack's motion.exit (CoverExit.jsx).
export default function Opening({ Cover, invitation, guestName }) {
  const { pack } = usePack()
  const { t } = useCopy()
  const dev = devOpeningOverrides()
  const opening = pack.manifest.opening || {}
  const type = dev.type || opening.type || 'none'
  const preset = dev.preset || opening.preset
  const duration = opening.durationMs || DEFAULT_DURATION
  const pinnedAt = dev.pinnedAt ?? null
  const reduced = useReducedMotion()
  const { opened, open, buttonRef } = useOpeningGate()
  const [done, setDone] = useState(type === 'none')
  const [gone, setGone] = useState(false)
  const exit = reduced ? 'fade' : pack.manifest.motion?.exit || 'fade'

  const finished = done || reduced
  useEffect(() => {
    if (finished || pinnedAt !== null || type === 'lottie') return undefined
    const t = setTimeout(() => setDone(true), duration)
    return () => clearTimeout(t)
  }, [finished, pinnedAt, type, duration])

  function skip() {
    if (!finished && pinnedAt === null) setDone(true)
  }

  // Lottie plays from a URL; layered-svg needs the SVG markup. The dev override
  // (?openingSrc) is a URL either way, so fetch its text for layered-svg.
  const slot = pack.manifest.slots?.opening
  const [devSvg, setDevSvg] = useState(null)
  useEffect(() => {
    if (type !== 'layered-svg' || !dev.src) return
    fetch(dev.src).then(r => r.text()).then(setDevSvg).catch(() => setDone(true))
  }, [type, dev.src])
  const src = type === 'lottie'
    ? dev.src || (slot && pack.urls[slot.lottie])
    : devSvg || (slot && pack.svgs[slot.svg])

  // Safety net: the exit also ends on a timer, in case its animation never
  // reports completion (e.g. a throttled background tab).
  useEffect(() => {
    if (!opened || gone) return undefined
    const t = setTimeout(() => setGone(true), 2500)
    return () => clearTimeout(t)
  }, [opened, gone])

  if (gone) return null
  if (opened) {
    return <CoverExit kind={exit} Cover={Cover} invitation={invitation} guestName={guestName} onDone={() => setGone(true)} />
  }
  return (
    <div
      className="pk-opening"
      role="dialog"
      aria-modal="true"
      aria-label={t('cover.aria')}
      data-opening={type}
      data-opening-preset={preset}
      data-state={finished ? 'done' : 'playing'}
      data-pinned={pinnedAt !== null ? '' : undefined}
      style={{ '--op-dur': `${duration}ms`, '--op-t': `${(pinnedAt ?? 0) * duration}ms` }}
      onPointerDown={skip}
      onKeyDown={skip}
    >
      {type === 'lottie' && src && (
        <Suspense fallback={null}>
          <LottieLayer src={src} pinnedAt={pinnedAt} finished={finished} onComplete={() => setDone(true)} />
        </Suspense>
      )}
      {type === 'layered-svg' && src && (
        <Suspense fallback={null}>
          <LayeredSvgLayer svg={src} preset={preset} duration={duration} pinnedAt={pinnedAt} finished={finished} />
        </Suspense>
      )}
      <Cover
        invitation={invitation}
        guestName={guestName}
        openButton={(
          <button className="pk-open-btn cover-open-btn" type="button" onClick={open} ref={buttonRef}>
            {t('cover.open')}
          </button>
        )}
      />
    </div>
  )
}
