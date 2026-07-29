import { AbsoluteFill, interpolate, spring, random, useCurrentFrame, useVideoConfig, Easing } from 'remotion'

/**
 * Animated backdrop for the javanese-dark cover gate.
 *
 * Deliberately paints *no type and no background colour* — the cover's framed
 * card, ornaments and names stay real DOM on top of this. The composition is a
 * purely additive layer: a kawung mandala that scribes itself in, drifting gold
 * dust, and a breathing pool of light.
 *
 * Authored as a Remotion composition (1080x1920 @ 30fps) rather than CSS
 * keyframes so the choreography is pinned to frame numbers and can be rendered
 * to MP4 later without change.
 *
 * Timeline (frames @30fps):
 *    0   glow + gold dust fade up
 *    8   mandala blooms outward, ring by ring
 *   10   hairline guide circles scribe themselves in
 *   70   bloom complete — ambient drift only
 *  570   1s crossfade so the 20s loop has no seam
 */

export const BACKDROP_FPS = 30
export const BACKDROP_DURATION = 600 // 20s loop
export const BACKDROP_WIDTH = 1080
export const BACKDROP_HEIGHT = 1920

const GOLD = '#c9a84c'
const GOLD_PALE = '#f3e4ad'

/** One kawung quatrefoil — the same two-crossed-ellipse glyph the theme tiles. */
function Quatrefoil({ cx, cy, scale }) {
  const rx = 12 * scale
  const ry = 17 * scale
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(45 ${cx} ${cy})`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(-45 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={2 * scale} />
    </g>
  )
}

// Concentric rings of kawung motifs. Density and opacity fall off outward so
// the mandala reads as radiating light rather than tiled wallpaper.
//
// Kept deliberately faint: the cover already carries a static tiled kawung
// texture, and at higher opacity the two patterns fight each other. This layer
// should register as slow movement, not as a second pattern.
const MANDALA_RINGS = [
  { radius: 0, count: 1, scale: 3.4, opacity: 0.18, delay: 0 },
  { radius: 250, count: 8, scale: 2.2, opacity: 0.11, delay: 8 },
  { radius: 480, count: 14, scale: 1.7, opacity: 0.07, delay: 16 },
  { radius: 730, count: 20, scale: 1.3, opacity: 0.045, delay: 24 },
]

/** Kawung mandala that blooms ring by ring, then drifts. */
function KawungMandala() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const cx = BACKDROP_WIDTH / 2
  const cy = BACKDROP_HEIGHT / 2

  return (
    <AbsoluteFill style={{ transform: `rotate(${frame * 0.011}deg)`, transformOrigin: 'center' }}>
      <svg width={BACKDROP_WIDTH} height={BACKDROP_HEIGHT} viewBox={`0 0 ${BACKDROP_WIDTH} ${BACKDROP_HEIGHT}`}>
        {/* Hairline circles binding the motif rings together — drawn on with
            a dash offset so the mandala scribes itself into existence. */}
        {MANDALA_RINGS.filter(r => r.radius > 0).map((ring, i) => {
          const circumference = 2 * Math.PI * ring.radius
          const draw = interpolate(frame, [10 + i * 9, 70 + i * 9], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          })
          return (
            <circle
              key={`guide-${ring.radius}`}
              cx={cx}
              cy={cy}
              r={ring.radius}
              fill="none"
              stroke={GOLD}
              strokeWidth={1}
              opacity={ring.opacity * 0.55}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - draw)}
            />
          )
        })}

        {MANDALA_RINGS.map((ring, ringIndex) => {
          const start = 8 + ring.delay
          const bloom = spring({
            frame: frame - start,
            fps,
            config: { damping: 200, mass: 1.1 },
            durationInFrames: 48,
          })
          // Slow breathing so the mandala never sits perfectly still.
          const breathe = 1 + Math.sin((frame / fps) * 0.55 + ringIndex) * 0.012

          return (
            <g
              key={ring.radius}
              fill="none"
              stroke={GOLD}
              strokeWidth={1.9}
              opacity={bloom * ring.opacity}
              style={{
                transform: `translate(${cx}px, ${cy}px) scale(${interpolate(bloom, [0, 1], [0.55, 1]) * breathe}) translate(${-cx}px, ${-cy}px)`,
                transformOrigin: '0 0',
              }}
            >
              {Array.from({ length: ring.count }).map((_, i) => {
                const angle = (i / ring.count) * Math.PI * 2
                return (
                  <Quatrefoil
                    key={i}
                    cx={cx + Math.cos(angle) * ring.radius}
                    cy={cy + Math.sin(angle) * ring.radius}
                    scale={ring.scale}
                  />
                )
              })}
            </g>
          )
        })}
      </svg>
    </AbsoluteFill>
  )
}

const DUST_COUNT = 54

/** Deterministic gold dust drifting upward — seeded, so renders are identical. */
function GoldDust() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill>
      {Array.from({ length: DUST_COUNT }).map((_, i) => {
        const seedX = random(`dust-x-${i}`)
        const seedY = random(`dust-y-${i}`)
        const seedSpeed = random(`dust-speed-${i}`)
        const seedSize = random(`dust-size-${i}`)

        const speed = 0.35 + seedSpeed * 0.9
        const travel = BACKDROP_HEIGHT + 200
        // Wrap with modulo so the drift is continuous across the loop point.
        const y = ((seedY * travel - frame * speed) % travel + travel) % travel - 100
        const drift = Math.sin((frame / fps) * 0.6 + i) * 26
        const size = 2 + seedSize * 4.5
        const twinkle = 0.25 + (Math.sin((frame / fps) * 1.4 + i * 2.1) + 1) / 2 * 0.55

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: seedX * BACKDROP_WIDTH + drift,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: GOLD_PALE,
              opacity: twinkle * 0.5,
              boxShadow: `0 0 ${size * 4}px rgba(201,168,76,0.6)`,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}

export default function JavaneseBackdrop() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Whole-composition fade: matches in and out so the 20s loop has no hard cut.
  const masterOpacity = interpolate(
    frame,
    [0, 22, BACKDROP_DURATION - 30, BACKDROP_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // Centre glow breathes slowly behind everything.
  const glowScale = 1 + Math.sin((frame / fps) * 0.4) * 0.06

  return (
    <AbsoluteFill style={{ opacity: masterOpacity }}>
      {/* Warm pool of light behind the mandala */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 34%, transparent 64%)',
          transform: `scale(${glowScale})`,
        }}
      />

      <KawungMandala />
      <GoldDust />

      {/* Fade the motif out toward the edges so it never crowds the frame. */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, transparent 42%, rgba(16,10,4,0.5) 100%)',
        }}
      />
    </AbsoluteFill>
  )
}
