/**
 * Timeline maths: the handful of primitives the motion layer actually used
 * from Remotion, reimplemented locally.
 *
 * Remotion's real value is rendering compositions to MP4. We never used that —
 * we used a seekable frame counter and four helper functions, and paid ~80KB
 * gzip plus a commercial licence for them. This module and `clock.js` are that
 * payload, minus the video encoder.
 */

/* ---------------------------------------------------------------- */
/* easing                                                            */
/* ---------------------------------------------------------------- */

const cubic = t => t * t * t

export const Easing = {
  linear: t => t,
  cubic,
  /** Fast start, gentle landing. */
  out: fn => t => 1 - fn(1 - t),
  /** Gentle start, fast middle, gentle landing. */
  inOut: fn => t => (t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2),
}

/* ---------------------------------------------------------------- */
/* interpolate                                                       */
/* ---------------------------------------------------------------- */

/**
 * Map a value from one range to another, with optional clamping and easing.
 *
 * Matches the Remotion signature the call sites already use, including the
 * requirement that `inputRange` increases monotonically — that constraint
 * caught a real bug (a scroll driver reading a range backwards), so it is kept
 * rather than quietly tolerated.
 */
export function interpolate(input, inputRange, outputRange, options = {}) {
  const {
    extrapolateLeft = 'extend',
    extrapolateRight = 'extend',
    easing = Easing.linear,
  } = options

  const [inMin, inMax] = inputRange
  const [outMin, outMax] = outputRange

  if (inMax < inMin) {
    throw new Error(
      `interpolate(): inputRange must be monotonically increasing, got [${inMin}, ${inMax}]`
    )
  }

  if (input <= inMin && extrapolateLeft === 'clamp') return outMin
  if (input >= inMax && extrapolateRight === 'clamp') return outMax

  const span = inMax - inMin
  const progress = span === 0 ? 0 : (input - inMin) / span
  return outMin + easing(progress) * (outMax - outMin)
}

/* ---------------------------------------------------------------- */
/* spring                                                            */
/* ---------------------------------------------------------------- */

/**
 * A 0→1 ramp with spring character, driven by a damping ratio.
 *
 * Deliberately an approximation of a damped harmonic oscillator rather than a
 * full solver: overdamped configs (the common case here) resolve to a smooth
 * ease-out, and underdamped ones overshoot and settle. Springs in this codebase
 * only ever drive `y` and `scale` — every opacity uses `interpolate` — so the
 * difference is in the feel of the landing, not in anything asserted or
 * snapshotted.
 */
export function spring({ frame, fps, config = {}, durationInFrames }) {
  const { damping = 10, mass = 1, stiffness = 100 } = config
  const duration = durationInFrames ?? fps * 0.6
  const t = Math.min(1, Math.max(0, frame / duration))

  if (t <= 0) return 0
  if (t >= 1) return 1

  // > 1 overdamped (no overshoot), < 1 underdamped (overshoots and settles).
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))

  if (zeta >= 1) {
    // Critically/overdamped: approach the target without crossing it.
    const k = 6
    return 1 - (1 + k * t) * Math.exp(-k * t)
  }

  // Underdamped: decaying oscillation around the target.
  const omega = Math.PI * 2 * (1 - zeta * 0.5)
  return 1 - Math.exp(-zeta * 6 * t) * Math.cos(omega * t)
}

/* ---------------------------------------------------------------- */
/* deterministic random                                              */
/* ---------------------------------------------------------------- */

/**
 * Stable pseudo-random in [0, 1) from any seed.
 *
 * The point is that the same seed yields the same value on every load and
 * every device — the property bare Math.random() cost us, and the reason the
 * WebGL themes could not be tested.
 */
export function random(seed) {
  const str = String(seed)
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  // Final avalanche, so neighbouring seeds ("dust-1", "dust-2") don't correlate.
  hash ^= hash >>> 15
  hash = Math.imul(hash, 2246822507)
  hash ^= hash >>> 13
  return (hash >>> 0) / 4294967296
}
