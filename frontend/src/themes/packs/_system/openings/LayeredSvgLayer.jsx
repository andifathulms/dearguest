import { useEffect, useRef } from 'react'
import { LAYERED_PRESETS } from './presets.js'

// Animates named <g id> layers of the pack's opening SVG with a preset from
// presets.js, via the Web Animations API so the intro can be pinned (tests) or
// finished (skip / reduced motion) exactly.
export default function LayeredSvgLayer({ svg, preset, duration, pinnedAt, finished }) {
  const ref = useRef(null)
  const anims = useRef([])

  useEffect(() => {
    const root = ref.current
    const steps = LAYERED_PRESETS[preset] || []
    anims.current = steps.flatMap(({ layer, keyframes, from = 0, to = 1, easing = 'ease-out' }) => {
      const el = root.querySelector(`#${CSS.escape(layer)}`)
      if (!el) return [] // a missing layer is skipped, not an error
      return [el.animate(keyframes, {
        duration: (to - from) * duration, delay: from * duration, fill: 'both', easing,
      })]
    })
    if (pinnedAt !== null) {
      anims.current.forEach(a => { a.pause(); a.currentTime = pinnedAt * duration })
    }
    return () => anims.current.forEach(a => a.cancel())
  }, [svg, preset, duration, pinnedAt])

  useEffect(() => {
    if (finished && pinnedAt === null) anims.current.forEach(a => a.finish())
  }, [finished, pinnedAt])

  // Pack SVGs are repo files, not user content.
  return <div className="pk-opening-layer" ref={ref} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
}
