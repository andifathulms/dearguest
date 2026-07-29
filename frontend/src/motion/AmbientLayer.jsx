import { lazy, Suspense } from 'react'
import SilentBoundary from '../components/ui/SilentBoundary.jsx'
import { useMotionClock } from './MotionClockContext.jsx'

// The Remotion runtime is a separate chunk — only themes with a motion clock
// pay for it, and only after the rest of the invitation is interactive.
const AmbientStage = lazy(() => import('./AmbientStage.jsx'))

/**
 * Mount point for the invitation's motion layer.
 *
 * Rendered by the theme itself so it lands inside the theme's stacking context
 * (see `.javanese-dark > .jd-ambient` in the theme CSS). Renders nothing when
 * the theme has no clock, when the guest prefers reduced motion, or if the
 * chunk fails to load — the invitation must never depend on it.
 */
export default function AmbientLayer() {
  const clock = useMotionClock()
  // 'clock-only' themes draw themselves with three.js and read the clock
  // directly from context — there is nothing for this layer to render.
  if (!clock || clock.composition === 'clock-only') return null

  return (
    <SilentBoundary>
      <Suspense fallback={null}>
        <AmbientStage clock={clock} />
      </Suspense>
    </SilentBoundary>
  )
}
