import { createContext, useContext, useMemo, useEffect } from 'react'
import { createFrameClock } from './clock.js'

/**
 * A single shared frame clock for the whole invitation.
 *
 * Every frame-driven element on the page reads from one clock. Per-section
 * timers would each mean their own loop and their own notion of "now" — fine
 * on a laptop, not on the mid-range Android most guests open these on, and
 * impossible to seek as a whole.
 *
 * The clock is plain arithmetic over performance.now() (see clock.js), so it
 * costs nothing to have running and is safe to create eagerly here. Only the
 * visual composition and the drivers are lazy-loaded.
 */

const MotionClockContext = createContext(null)

/** The shared clock, or null when this theme has no motion layer. */
export function useMotionClock() {
  return useContext(MotionClockContext)
}

export function MotionClockProvider({ config, fps = 30, children }) {
  const compositionKey = config?.composition ?? null
  const featureKey = config ? JSON.stringify(config.features || {}) : ''

  const clock = useMemo(() => {
    if (!config) return null
    const base = createFrameClock({ fps, durationInFrames: 600, loop: true })
    const targets = new Set()
    const watchers = new Set()
    const notify = () => watchers.forEach(w => w())

    return Object.assign(base, {
      // Which composition the visual layer renders, if any. 'clock-only' means
      // the theme draws itself (three.js) and wants nothing but the frame.
      composition: compositionKey,
      // Which drivers this theme opts into. Drivers carry theme-specific
      // styling assumptions, so they are enabled per theme rather than by the
      // mere presence of a clock.
      features: config.features || {},
      targets,
      addTarget(target) {
        targets.add(target)
        notify()
        return () => {
          targets.delete(target)
          notify()
        }
      },
      /** Called whenever the target set changes, so drivers can be rebuilt. */
      watch(fn) {
        watchers.add(fn)
        return () => watchers.delete(fn)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fps, compositionKey, featureKey])

  useEffect(() => {
    if (!clock) return

    // Dev-only: `?frame=N` starts the clock paused on a given frame. Visual
    // tests otherwise have to race the reveal — seek a moment too late and the
    // driver has already settled, after which that frame cannot be inspected.
    const frameParam = import.meta.env.DEV
      ? new URLSearchParams(window.location.search).get('frame')
      : null

    if (frameParam) {
      clock.pinned = true
      clock.pause()
      clock.seekTo(Number(frameParam))
    } else {
      clock.play()
    }

    if (import.meta.env.DEV) {
      window.__backdrop = clock
      window.__clock = clock
    }
  }, [clock])

  return <MotionClockContext.Provider value={clock}>{children}</MotionClockContext.Provider>
}

/**
 * Register a DOM node to be driven by the shared clock.
 *
 * A no-op when the theme has not opted into this driver — which is the case
 * for 34 of the 35 themes, and for reduced-motion guests. Sections calling
 * this keep their ordinary Framer Motion entrances either way; drivers only
 * ever add motion on top.
 */
export function useMotionTarget(kind, ref, options) {
  const clock = useMotionClock()
  // Options are read once at registration; serialise so a fresh object literal
  // on every render doesn't churn the registry.
  const optionsKey = options ? JSON.stringify(options) : ''

  useEffect(() => {
    if (!clock?.features?.[kind] || !ref.current) return
    return clock.addTarget({ kind, node: ref.current, options: options || {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, kind, optionsKey])
}
