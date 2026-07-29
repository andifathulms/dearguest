import { interpolate, spring, Easing } from './timing.js'

/**
 * The cover card's reveal, expressed as a pure function of frame.
 *
 * This is the timeline the Remotion backdrop and the real DOM card share. The
 * backdrop composition owns the frame clock; `useCoverReveal` samples this
 * function against that clock and writes the result onto the actual cover
 * elements. One clock, one timeline — which is the whole reason Remotion is
 * here rather than a pile of CSS keyframes.
 *
 * Nothing below touches the DOM or React, so the same timeline can drive an
 * MP4 render later without change.
 */

// Beats, in frames @30fps.
export const BEATS = {
  label: 14,
  bride: 30,
  amp: 52,
  groom: 62,
  divider: 88,
  date: 100,
  guest: 114,
  cta: 128,
}

// Frame at which every element has settled. The driver stops here — the
// backdrop keeps looping, but the card reveals exactly once.
export const REVEAL_END = 175

const ENTRANCE_FRAMES = 28

/** Eased 0→1 ramp for an element starting at `start`. */
function ramp(frame, start, duration = ENTRANCE_FRAMES) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

/** Springy 0→1 ramp, for the elements that should feel like they land. */
function settle(frame, start, fps, config = { damping: 200, mass: 0.7 }) {
  return spring({ frame: frame - start, fps, config, durationInFrames: ENTRANCE_FRAMES + 6 })
}

/**
 * A gold sweep that crosses the glyphs once as a name arrives, then rests
 * centred. Returned as a `background-position-x` percentage.
 */
function sweep(frame, start) {
  return interpolate(frame, [start, start + 46], [190, 55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

/**
 * Sample the whole reveal at `frame`.
 *
 * Values are unitless ratios so the driver can apply them against whatever
 * resting values the theme's own CSS happens to use — nothing here hardcodes a
 * pixel size, letter-spacing or width.
 */
export function revealAt(frame, fps) {
  return {
    label: {
      opacity: ramp(frame, BEATS.label),
      // Letter-spacing contracts toward the theme's resting value.
      spread: interpolate(ramp(frame, BEATS.label, 46), [0, 1], [2.1, 1]),
    },
    bride: {
      opacity: ramp(frame, BEATS.bride),
      y: interpolate(settle(frame, BEATS.bride, fps), [0, 1], [34, 0]),
      sweep: sweep(frame, BEATS.bride),
    },
    amp: {
      opacity: ramp(frame, BEATS.amp, 20),
      scale: interpolate(
        settle(frame, BEATS.amp, fps, { damping: 12, mass: 0.5, stiffness: 140 }),
        [0, 1],
        [0.3, 1]
      ),
    },
    groom: {
      opacity: ramp(frame, BEATS.groom),
      y: interpolate(settle(frame, BEATS.groom, fps), [0, 1], [34, 0]),
      sweep: sweep(frame, BEATS.groom),
    },
    divider: {
      opacity: ramp(frame, BEATS.divider, 20),
      // Ratio of the divider's own resting width — it draws out from centre.
      width: ramp(frame, BEATS.divider, 34),
    },
    date: {
      opacity: ramp(frame, BEATS.date),
      y: interpolate(settle(frame, BEATS.date, fps), [0, 1], [18, 0]),
    },
    guest: {
      opacity: ramp(frame, BEATS.guest),
      y: interpolate(settle(frame, BEATS.guest, fps), [0, 1], [22, 0]),
    },
    cta: {
      opacity: ramp(frame, BEATS.cta),
      y: interpolate(settle(frame, BEATS.cta, fps), [0, 1], [22, 0]),
    },
  }
}
