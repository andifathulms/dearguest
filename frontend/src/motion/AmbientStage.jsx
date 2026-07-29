import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createDriver } from './drivers.js'
import JavaneseBackdrop, { BACKDROP_FPS, BACKDROP_WIDTH, BACKDROP_HEIGHT } from './JavaneseBackdrop.jsx'

/**
 * The invitation's visual motion layer, plus the one rAF loop that drives every
 * registered element from the shared clock.
 *
 * It outlives the cover gate deliberately: the composition used to be mounted
 * inside CoverGate, which meant it played for six seconds and was then thrown
 * away the moment the guest tapped "Buka Undangan". Here it keeps running
 * behind the whole invitation, dimmed once the cover is gone.
 *
 * The composition is authored at 1080x1920, so the stage is sized to *cover*
 * the viewport (the CSS max() pair in .jd-ambient-stage) rather than letterbox.
 */
export default function AmbientStage({ clock }) {
  const [contentMode, setContentMode] = useState(false)
  const stageRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [frame, setFrame] = useState(() => clock.getCurrentFrame())
  const frameRef = useRef(frame)

  // The composition is authored in 1080x1920 pixel units, so it has to be
  // scaled to the stage — this is the one job the Player did that is not just
  // a frame counter.
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const fit = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      setScale(Math.max(width / BACKDROP_WIDTH, height / BACKDROP_HEIGHT))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Behind the cover the backdrop is the whole picture; behind the invitation
  // body it has to stay out of the way of photos and text.
  useEffect(() => {
    const onOpen = () => setContentMode(true)
    window.addEventListener('invitation:open', onOpen)
    return () => window.removeEventListener('invitation:open', onOpen)
  }, [])

  // One rAF loop for every driven element on the page, plus the composition's
  // own re-render.
  useEffect(() => {
    let raf = 0
    let drivers = []
    let stale = true

    const markStale = () => {
      stale = true
    }
    const unwatch = clock.watch(markStale)

    function rebuild() {
      const seen = new Map(drivers.map(d => [d.target, d]))
      const next = []
      for (const target of clock.targets) {
        const existing = seen.get(target)
        if (existing) {
          next.push(existing)
          seen.delete(target)
          continue
        }
        const driver = createDriver(target, { fps: clock.fps, pinned: clock.pinned })
        if (driver) next.push({ target, driver })
      }
      // Anything still in `seen` was unregistered — let it clean up after itself.
      for (const [, gone] of seen) gone.driver.dispose?.()
      drivers = next
      stale = false
    }

    function tick() {
      if (stale) rebuild()

      const current = clock.getCurrentFrame()

      // Re-render the composition only when the frame actually changes: the
      // clock is read every animation frame, but at 30fps on a 120Hz display
      // three quarters of those reads are the same number.
      if (current !== frameRef.current) {
        frameRef.current = current
        setFrame(current)
      }

      if (drivers.length) {
        const alive = []
        for (const entry of drivers) {
          let keep = true
          try {
            keep = entry.driver.tick(current) !== false
          } catch (err) {
            // Drop the offending driver, never the loop. Silent in production,
            // loud in dev — a driver that throws on frame 1 is otherwise
            // indistinguishable from one that simply does nothing.
            if (import.meta.env.DEV) console.warn(`[motion] driver "${entry.target.kind}" threw; dropping it`, err)
            keep = false
          }
          if (keep) alive.push(entry)
        }
        drivers = alive
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      unwatch()
      drivers.forEach(d => d.driver.dispose?.())
    }
  }, [clock])

  return (
    <div className={`jd-ambient${contentMode ? ' jd-ambient--content' : ''}`} aria-hidden="true">
      <div className="jd-ambient-stage" ref={stageRef}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: BACKDROP_WIDTH,
            height: BACKDROP_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <JavaneseBackdrop frame={frame} fps={BACKDROP_FPS} />
        </div>
      </div>
    </div>
  )
}
