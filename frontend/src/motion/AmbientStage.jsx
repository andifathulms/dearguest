import { useEffect, useRef, useState } from 'react'
import { Player } from '@remotion/player'
import { createDriver } from './drivers.js'
import JavaneseBackdrop, {
  BACKDROP_FPS,
  BACKDROP_DURATION,
  BACKDROP_WIDTH,
  BACKDROP_HEIGHT,
} from './JavaneseBackdrop.jsx'

/**
 * The invitation's single motion layer: one Remotion Player, mounted for the
 * life of the invitation, plus the one rAF loop that drives every registered
 * element from its frame counter.
 *
 * It outlives the cover gate deliberately. The composition used to be mounted
 * inside CoverGate, which meant 80KB of Remotion was fetched, played for six
 * seconds and thrown away the moment the guest tapped "Buka Undangan". Here it
 * keeps running behind the whole invitation, dimmed once the cover is gone.
 *
 * The composition is authored at 1080x1920, so the stage is sized to *cover*
 * the viewport (the CSS max() pair in .jd-ambient-stage) rather than letterbox.
 */
export default function AmbientStage({ clock }) {
  const playerRef = useRef(null)
  const [contentMode, setContentMode] = useState(false)

  // `autoPlay` alone is unreliable — Remotion mounts silent <audio> elements to
  // keep A/V in sync, and browsers treat that as blocked media playback. Drive
  // playback explicitly, and retry on the guest's first interaction if the
  // browser still refuses.
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    clock.playerRef.current = player

    const start = () => {
      try {
        if (!player.isPlaying()) player.play()
      } catch {
        /* player unmounted mid-retry */
      }
    }

    start()

    if (import.meta.env.DEV) {
      window.__backdrop = player
      window.__clock = clock
    }

    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll']
    events.forEach(e => window.addEventListener(e, start, { once: true, passive: true }))
    return () => {
      events.forEach(e => window.removeEventListener(e, start))
      clock.playerRef.current = null
    }
  }, [clock])

  // Behind the cover the backdrop is the whole picture; behind the invitation
  // body it has to stay out of the way of photos and text.
  useEffect(() => {
    const onOpen = () => setContentMode(true)
    window.addEventListener('invitation:open', onOpen)
    return () => window.removeEventListener('invitation:open', onOpen)
  }, [])

  // One rAF loop for every driven element on the page.
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
        const driver = createDriver(target, { fps: BACKDROP_FPS })
        if (driver) next.push({ target, driver })
      }
      // Anything still in `seen` was unregistered — let it clean up after itself.
      for (const [, gone] of seen) gone.driver.dispose?.()
      drivers = next
      stale = false
    }

    function tick() {
      if (stale) rebuild()

      const frame = playerRef.current?.getCurrentFrame?.() ?? 0
      if (drivers.length) {
        const alive = []
        for (const entry of drivers) {
          let keep = true
          try {
            keep = entry.driver.tick(frame) !== false
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
      <div className="jd-ambient-stage">
        <Player
          ref={playerRef}
          component={JavaneseBackdrop}
          durationInFrames={BACKDROP_DURATION}
          fps={BACKDROP_FPS}
          compositionWidth={BACKDROP_WIDTH}
          compositionHeight={BACKDROP_HEIGHT}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          loop
          initiallyMuted
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          allowFullscreen={false}
        />
      </div>
    </div>
  )
}
