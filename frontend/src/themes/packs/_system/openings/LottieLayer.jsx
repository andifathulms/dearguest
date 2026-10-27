import { useEffect, useRef } from 'react'

// Plays the pack's Lottie opening behind the cover content. This module (and
// lottie-web's light SVG player) is its own chunk, fetched only by packs whose
// opening.type is "lottie".
export default function LottieLayer({ src, pinnedAt, finished, onComplete }) {
  const ref = useRef(null)
  const anim = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('lottie-web/build/player/lottie_light'),
      fetch(src).then(r => r.json()),
    ]).then(([{ default: lottie }, animationData]) => {
      if (cancelled || !ref.current) return
      const a = lottie.loadAnimation({
        container: ref.current, renderer: 'svg', loop: false, autoplay: false, animationData,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      })
      anim.current = a
      a.addEventListener('complete', onComplete)
      const last = a.totalFrames - 1
      if (pinnedAt !== null) a.goToAndStop(pinnedAt * last, true)
      else if (finished) a.goToAndStop(last, true)
      else a.play()
    }).catch(() => onComplete()) // a broken animation must never block the cover
    return () => {
      cancelled = true
      anim.current?.destroy()
    }
  }, [src]) // eslint-disable-line react-hooks/exhaustive-deps

  // Skipped (tap) or reduced motion: jump to the final frame.
  useEffect(() => {
    if (finished && pinnedAt === null && anim.current) anim.current.goToAndStop(anim.current.totalFrames - 1, true)
  }, [finished, pinnedAt])

  return <div className="pk-opening-layer pk-opening-lottie" ref={ref} aria-hidden="true" />
}
