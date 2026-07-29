import { interpolate, Easing } from 'remotion'
import { revealAt, REVEAL_END } from './coverTimeline.js'

/**
 * Drivers turn a registered DOM node into something the shared frame clock
 * animates. Each factory returns `{ tick(frame), dispose() }`; AmbientStage
 * calls every live driver once per animation frame from a single rAF loop.
 *
 * `tick` returns `false` when the driver is finished and should be dropped.
 *
 * Everything Remotion-flavoured is confined to this file and coverTimeline.js,
 * both of which are only reachable through the lazy AmbientStage chunk.
 */

const GOLD_GRADIENT =
  'linear-gradient(100deg, #9c7f38 0%, #c9a84c 28%, #f3e4ad 46%, #fffbe9 50%, #f3e4ad 54%, #c9a84c 72%, #9c7f38 100%)'

// If the clock never advances (autoplay blocked, tab backgrounded) don't leave
// a driven element mid-reveal.
const STALL_MS = 1500

/* ------------------------------------------------------------------ */
/* cover — the gate's card, revealed once against the frame clock       */
/* ------------------------------------------------------------------ */

function coverDriver(card, { fps, onStart }) {
  const el = {
    label: card.querySelector('.cover-label'),
    bride: card.querySelector('.cover-name-bride'),
    amp: card.querySelector('.cover-amp'),
    groom: card.querySelector('.cover-name-groom'),
    divider: card.querySelector('.cover-divider'),
    date: card.querySelector('.cover-date'),
    guest: card.querySelector('.cover-guest'),
    cta: card.querySelector('.cover-open-btn'),
  }

  // Resting values come from the theme's own CSS, so nothing here hardcodes a
  // size and the same driver works on any theme.
  const restingSpacing = el.label ? parseFloat(getComputedStyle(el.label).letterSpacing) || 0 : 0
  const restingDivider = el.divider ? el.divider.offsetWidth : 0

  // Each name paints its own gradient so the two sweeps can be timed apart —
  // the theme's shared background-clip:text on the heading cannot do that.
  for (const name of [el.bride, el.groom]) {
    if (!name) continue
    name.style.display = 'inline-block'
    name.style.backgroundImage = GOLD_GRADIENT
    name.style.backgroundSize = '220% auto'
    name.style.webkitBackgroundClip = 'text'
    name.style.backgroundClip = 'text'
    name.style.webkitTextFillColor = 'transparent'
  }

  let started = false
  let lastFrame = -1
  let lastAdvance = performance.now()
  let done = false

  function apply(frame) {
    const t = revealAt(frame, fps)
    if (el.label) {
      el.label.style.opacity = t.label.opacity
      el.label.style.letterSpacing = `${restingSpacing * t.label.spread}px`
    }
    if (el.bride) {
      el.bride.style.opacity = t.bride.opacity
      el.bride.style.transform = `translateY(${t.bride.y}px)`
      el.bride.style.backgroundPosition = `${t.bride.sweep}% center`
    }
    if (el.amp) {
      el.amp.style.opacity = t.amp.opacity
      el.amp.style.transform = `scale(${t.amp.scale})`
    }
    if (el.groom) {
      el.groom.style.opacity = t.groom.opacity
      el.groom.style.transform = `translateY(${t.groom.y}px)`
      el.groom.style.backgroundPosition = `${t.groom.sweep}% center`
    }
    if (el.divider) {
      el.divider.style.opacity = t.divider.opacity
      el.divider.style.width = `${restingDivider * t.divider.width}px`
    }
    if (el.date) {
      el.date.style.opacity = t.date.opacity
      el.date.style.transform = `translateY(${t.date.y}px)`
    }
    if (el.guest) {
      el.guest.style.opacity = t.guest.opacity
      el.guest.style.transform = `translateY(${t.guest.y}px)`
    }
    if (el.cta) {
      el.cta.style.opacity = t.cta.opacity
      el.cta.style.transform = `translateY(${t.cta.y}px)`
    }
  }

  /** Hand the resting state back to CSS. */
  function settle() {
    if (done) return
    done = true
    for (const node of Object.values(el)) {
      if (!node) continue
      node.style.opacity = ''
      node.style.transform = ''
      node.style.letterSpacing = ''
      node.style.width = ''
    }
    // The names keep their own gradient — clearing it mid-shimmer would flicker
    // them back onto the heading's clip.
    for (const name of [el.bride, el.groom]) {
      if (name) name.style.backgroundPosition = ''
    }
  }

  // Hide everything before the first driven paint, then reveal the card itself.
  apply(0)
  card.style.opacity = '1'
  onStart?.()

  return {
    tick(frame) {
      if (frame !== lastFrame) {
        lastFrame = frame
        lastAdvance = performance.now()
        started = true
      } else if (performance.now() - lastAdvance > STALL_MS) {
        settle()
        return false
      }

      apply(frame)

      // The ambient composition loops every 20s; the card reveals exactly once.
      if (started && frame >= REVEAL_END) {
        settle()
        return false
      }
      return true
    },
    dispose: settle,
  }
}

/* ------------------------------------------------------------------ */
/* story — timeline spine scrubbed by scroll, not by time              */
/* ------------------------------------------------------------------ */

/**
 * The one place the clock is deliberately *not* the frame counter.
 *
 * A story timeline should draw at the guest's pace, so this samples scroll
 * position instead — but it still runs inside the shared rAF loop rather than
 * adding a scroll listener of its own, and still expresses the result as a
 * 0→1 timeline. Writes a CSS custom property so the spine (a ::before
 * pseudo-element) can be animated without inline styles.
 */
function storyDriver(node) {
  let last = -1

  return {
    tick() {
      const rect = node.getBoundingClientRect()
      const viewport = window.innerHeight || 1

      // 0 when the top of the timeline reaches the lower quarter of the screen,
      // 1 once its bottom has passed the middle.
      //
      // Expressed against -rect.top because scrolling down *decreases* rect.top,
      // and interpolate() requires a monotonically increasing input range.
      const start = viewport * 0.75
      const end = viewport * 0.4
      const progress = interpolate(-rect.top, [-start, rect.height - end], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.linear,
      })

      // Only touch the DOM when it actually changed.
      const rounded = Math.round(progress * 500) / 500
      if (rounded !== last) {
        last = rounded
        node.style.setProperty('--spine-draw', rounded)
      }
      return true
    },
    dispose() {
      node.style.removeProperty('--spine-draw')
    },
  }
}

/* ------------------------------------------------------------------ */
/* gallery — slow ken-burns drift, genuinely time-based                */
/* ------------------------------------------------------------------ */

/**
 * A continuous, seeded drift across the gallery photos. Time-based rather than
 * scroll-based: the photos keep breathing while the guest reads, which is the
 * kind of motion an entrance animation cannot express.
 */
function galleryDriver(node, { fps }) {
  const images = Array.from(node.querySelectorAll('img'))
  images.forEach(img => {
    img.style.willChange = 'transform'
  })

  return {
    tick(frame) {
      const seconds = frame / fps
      images.forEach((img, i) => {
        // Long, mutually-offset cycles so no two photos move in lockstep.
        const phase = seconds * 0.16 + i * 1.7
        const scale = 1.06 + Math.sin(phase) * 0.035
        const x = Math.sin(phase * 0.7 + i) * 1.4
        const y = Math.cos(phase * 0.55 + i * 0.6) * 1.4
        img.style.transform = `scale(${scale}) translate(${x}%, ${y}%)`
      })
      return true
    },
    dispose() {
      images.forEach(img => {
        img.style.transform = ''
        img.style.willChange = ''
      })
    },
  }
}

const FACTORIES = {
  cover: coverDriver,
  story: storyDriver,
  gallery: galleryDriver,
}

export function createDriver(target, context) {
  const factory = FACTORIES[target.kind]
  if (!factory) return null
  try {
    return factory(target.node, { ...context, ...target.options })
  } catch (err) {
    // A driver must never be able to break the invitation it decorates.
    if (import.meta.env.DEV) console.warn(`[motion] driver "${target.kind}" failed to start`, err)
    return null
  }
}
