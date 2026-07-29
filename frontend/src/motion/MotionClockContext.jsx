import { createContext, useContext, useMemo, useEffect } from 'react'

/**
 * A single shared frame clock for the whole invitation.
 *
 * One Remotion Player is mounted per invitation (see AmbientStage) and every
 * frame-driven element on the page subscribes to it. Mounting a Player per
 * section would mean a requestAnimationFrame loop and a composition tree each —
 * fine on a laptop, not on the mid-range Android most guests open these on.
 *
 * This module deliberately imports nothing from Remotion. It is loaded by the
 * main bundle (CoverGate, the sections), while everything that actually touches
 * Remotion lives behind the lazy AmbientStage chunk. Components register a DOM
 * node and a driver *kind*; the lazy chunk decides how to animate it, and does
 * nothing at all if it never loads.
 */

const MotionClockContext = createContext(null)

/** The shared clock, or null when this theme has no motion layer. */
export function useMotionClock() {
  return useContext(MotionClockContext)
}

function createClock(fps, composition, features) {
  const targets = new Set()
  const watchers = new Set()
  const notify = () => watchers.forEach(w => w())

  return {
    fps,
    // Which composition the Player renders. 'clock-only' mounts a hidden
    // Player purely as a frame source — used by the WebGL themes, where the
    // three.js canvas is the visual and Remotion just supplies the clock.
    composition,
    // Which drivers this theme opts into. Drivers carry theme-specific styling
    // assumptions, so they are enabled per theme rather than by the mere
    // presence of a clock.
    features,
    // Assigned by AmbientStage once the Player mounts.
    playerRef: { current: null },
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
  }
}

export function MotionClockProvider({ config, fps = 30, children }) {
  const compositionKey = config?.composition ?? null
  const featureKey = config ? JSON.stringify(config.features || {}) : ''
  const clock = useMemo(
    () => (config ? createClock(fps, compositionKey, config.features || {}) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fps, compositionKey, featureKey]
  )
  return <MotionClockContext.Provider value={clock}>{children}</MotionClockContext.Provider>
}

/**
 * Register a DOM node to be driven by the shared clock.
 *
 * A no-op when there is no clock — which is the case for 34 of the 35 themes,
 * and for reduced-motion guests. Sections calling this keep their ordinary
 * Framer Motion entrances either way; drivers only ever add motion on top.
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
