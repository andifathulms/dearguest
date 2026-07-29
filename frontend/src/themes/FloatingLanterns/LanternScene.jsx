// Floating Lanterns — a DARK, romantic WebGL scene: warm glowing sky-lanterns
// rising into a dusk/night sky, with drifting embers and cool stars above.
// Evokes the lantern release from Tangled. Composes the shared foundation.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CinematicCanvas, DriftPoints, softTexture, seeded } from '../_cinematic/shared.jsx'
import { useMotionClock } from '../../motion/MotionClockContext.jsx'

// A graduated dusk sky (deep indigo zenith → warm amber horizon) painted on a
// big backdrop plane. Gives the lanterns and embers something to glow against.
function skyTexture() {
  const c = document.createElement('canvas')
  c.width = 4; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#101830')   // deep indigo/navy zenith
  g.addColorStop(0.45, '#182142')
  g.addColorStop(0.78, '#c96a2e') // warm amber horizon
  g.addColorStop(1, '#e8a24c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

function SkyBackdrop() {
  const tex = useMemo(() => skyTexture(), [])
  return (
    <mesh position={[0, 0, -18]} scale={[100, 60, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  )
}

// A single warm lantern: bright amber core, soft rounded warm body, outer glow.
function lanternTexture() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')

  // soft outer glow
  const glow = ctx.createRadialGradient(s / 2, s * 0.52, 0, s / 2, s * 0.52, s * 0.5)
  glow.addColorStop(0, 'rgba(232,137,46,0.55)')
  glow.addColorStop(0.5, 'rgba(232,137,46,0.18)')
  glow.addColorStop(1, 'rgba(232,137,46,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, s, s)

  // rounded warm body
  const bx = s * 0.32, by = s * 0.3, bw = s * 0.36, bh = s * 0.44, r = s * 0.12
  const body = ctx.createLinearGradient(0, by, 0, by + bh)
  body.addColorStop(0, 'rgba(255,207,138,0.95)')
  body.addColorStop(0.5, 'rgba(240,160,70,0.95)')
  body.addColorStop(1, 'rgba(232,137,46,0.9)')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, r)
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, r)
  ctx.arcTo(bx, by + bh, bx, by, r)
  ctx.arcTo(bx, by, bx + bw, by, r)
  ctx.closePath()
  ctx.fill()

  // bright amber core
  const core = ctx.createRadialGradient(s / 2, s * 0.5, 0, s / 2, s * 0.5, s * 0.18)
  core.addColorStop(0, 'rgba(255,247,224,0.98)')
  core.addColorStop(0.5, 'rgba(255,207,138,0.9)')
  core.addColorStop(1, 'rgba(255,207,138,0)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(s / 2, s * 0.5, s * 0.18, 0, Math.PI * 2)
  ctx.fill()

  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// ---- signature: warm lanterns that rise upward and wrap, swaying gently ----
//
// Every lantern's position is a pure function of elapsed time: seeded setup,
// and a modulo wrap rather than mutating `d.y` frame by frame. The old version
// accumulated `d.y += d.speed * dt`, which made the scene depend on how many
// frames had been rendered — so it drifted differently on a slow phone than on
// a fast laptop, and no frame could ever be reproduced or asserted against.
function Lanterns({ count, clock }) {
  const grp = useRef()
  const tex = useMemo(() => lanternTexture(), [])
  const area = useMemo(() => [34, 30, 12], [])
  const span = area[1] + 12 // wrap distance, padded so lanterns leave the frame

  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (seeded(i * 9 + 1) - 0.5) * area[0],
    y: (seeded(i * 9 + 2) - 0.5) * area[1],
    z: -3 - seeded(i * 9 + 3) * 11,             // ~-3..-14
    scale: 1 + seeded(i * 9 + 4) * 2,           // ~1–3
    opacity: 0.8 + seeded(i * 9 + 5) * 0.2,     // ~0.8–1
    speed: 0.35 + seeded(i * 9 + 6) * 0.7,      // slow rise
    swayAmp: 0.3 + seeded(i * 9 + 7) * 0.9,
    swayPh: seeded(i * 9 + 8) * Math.PI * 2,
    swaySpeed: 0.15 + seeded(i * 9 + 9) * 0.25,
  })), [count, area])

  useFrame((state) => {
    if (!grp.current) return
    // Prefer the shared clock so the scene is deterministic and seekable; fall
    // back to wall time while the motion chunk is still loading.
    const frame = clock?.getCurrentFrame?.()
    const t = frame != null ? frame / clock.fps : state.clock.elapsedTime

    grp.current.children.forEach((m, i) => {
      const d = data[i]
      const risen = d.y + t * d.speed + span / 2
      m.position.y = ((risen % span) + span) % span - span / 2
      m.position.x = d.x + Math.sin(t * d.swaySpeed + d.swayPh) * d.swayAmp
    })
    if (import.meta.env.DEV) {
      const first = grp.current.children[0]
      window.__lanterns = first ? { y: first.position.y, x: first.position.x } : null
    }
  })

  return (
    <group ref={grp}>
      {data.map((d, i) => (
        <sprite key={i} position={[d.x, d.y, d.z]} scale={[d.scale, d.scale * 1.15, 1]}>
          <spriteMaterial
            map={tex}
            transparent
            opacity={d.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  )
}

function SceneInner({ cfg, reduce, clock }) {
  const lanternCount = Math.round(18 * cfg.mul)
  const emberCount = Math.round(120 * cfg.mul)
  const starCount = Math.round(120 * cfg.mul)
  const horizon = useMemo(() => softTexture('rgba(232,150,60,0.8)'), [])

  return (
    <>
      {/* graduated dusk sky so lanterns/embers have contrast */}
      <SkyBackdrop />

      {/* soft warm horizon glow, low and wide */}
      <sprite position={[0, -6, -13]} scale={[30, 16, 1]}>
        <spriteMaterial map={horizon} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* signature rising lanterns — keyed by count (buffers can't resize) */}
      <Lanterns key={`lanterns-${lanternCount}`} count={lanternCount} clock={clock} />

      {/* rising sparks / embers */}
      <DriftPoints
        key={`embers-${emberCount}`}
        count={emberCount}
        size={0.09}
        color="#ef9a4a"
        opacity={0.8}
        rise={0.6}
        additive
        reduce={reduce}
        clock={clock}
      />

      {/* cool stars in the upper sky */}
      <DriftPoints
        key={`stars-${starCount}`}
        count={starCount}
        size={0.06}
        color="#eaf0ff"
        opacity={0.8}
        rise={0.1}
        additive
        reduce={reduce}
        clock={clock}
      />
    </>
  )
}

export default function LanternScene({ quality, onQuality, dpr }) {
  const clock = useMotionClock()
  return (
    <CinematicCanvas
      quality={quality}
      onQuality={onQuality}
      bg="#0b1226"
      fog={['#0b1226', 24, 58]}
      baseZ={9}
      warpTo={6.5}
      bloom={1.2}
      bloomThreshold={0.14}
      clock={clock}
      dpr={dpr}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} clock={clock} />}
    </CinematicCanvas>
  )
}
