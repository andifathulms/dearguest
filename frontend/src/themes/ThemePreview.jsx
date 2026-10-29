import { useEffect, useRef, useState } from 'react'
import './ThemePreview.css'

// Preview tile for a registry theme card (landing, /tema): the pack's
// screenshot once it has one, else a mock drawn from the registry colours.
// With `loop`, a theme that has a preview video (frontend/scripts/
// capture-docker.sh) plays it on hover, or on touch screens while the card
// is mostly in view. The source is attached on the first play, so nothing
// downloads before that (Safari fetches <source>s despite preload="none"),
// and it never plays for people who prefer reduced motion.
export default function ThemePreview({ theme, className = '', badge, loop = false }) {
  const label = badge ?? theme.badge
  const video = loop && theme.previewVideo ? theme.previewVideo : null
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)

  const play = () => {
    const el = ref.current
    if (!el || reducedMotion()) return
    if (!el.getAttribute('src')) el.src = el.canPlayType('video/webm; codecs="vp9"') ? video.webm : video.mp4
    el.play().then(() => setPlaying(true)).catch(() => {})
  }
  const stop = () => {
    const el = ref.current
    if (!el) return
    el.pause()
    setPlaying(false)
  }

  // Touch screens have no hover: play while at least 60% of the card shows.
  useEffect(() => {
    const el = ref.current
    if (!video || !el || !window.matchMedia?.('(hover: none)').matches || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => (entry.intersectionRatio >= 0.6 ? play() : stop()), { threshold: [0, 0.6] })
    io.observe(el)
    return () => io.disconnect()
  }, [video]) // eslint-disable-line react-hooks/exhaustive-deps

  if (theme.previewImage) {
    return (
      <div className={`lp-theme-preview tp-shot ${playing ? 'tp-playing' : ''} ${className}`}
        onMouseEnter={video ? play : undefined} onMouseLeave={video ? stop : undefined}>
        {label && <span className="tp-badge">{label}</span>}
        <img className="tp-image" src={theme.previewImage} alt={`Pratinjau tema ${theme.name}`} loading="lazy" decoding="async" />
        {video && (
          <video ref={ref} className="tp-video" muted loop playsInline preload="none" poster={theme.previewImage} aria-hidden="true" tabIndex={-1} />
        )}
      </div>
    )
  }
  const style = { background: theme.card.bg, color: theme.card.fg, '--tp-accent': theme.card.accent }
  return (
    <div className={`lp-theme-preview tp-registry ${className}`} style={style}>
      {label && <span className="tp-badge">{label}</span>}
      <span className="tp-label">Undangan Pernikahan</span>
      <div className="tp-names lp-serif">
        Andini<span className="tp-amp">&amp;</span>Bagus
      </div>
      <div className="tp-rule" />
      <span className="tp-date">12 · 12 · 2026</span>
    </div>
  )
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
