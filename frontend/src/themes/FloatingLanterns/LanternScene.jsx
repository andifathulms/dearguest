// Floating Lanterns — a DARK, romantic WebGL scene: warm glowing sky-lanterns
// rising into a dusk/night sky, with drifting embers and cool stars above.
// Evokes the lantern release from Tangled. Composes the shared foundation.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CinematicCanvas, DriftPoints, softTexture } from '../_cinematic/shared.jsx'

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
function Lanterns({ count }) {
  const grp = useRef()
  const tex = useMemo(() => lanternTexture(), [])
  const area = useMemo(() => [34, 30, 12], [])
  const halfH = area[1] / 2 + 6 // padding so lanterns wrap fully off-screen

  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * area[0],
    y: (Math.random() - 0.5) * area[1],
    z: -3 - Math.random() * 11,             // ~-3..-14
    scale: 1 + Math.random() * 2,           // ~1–3
    opacity: 0.8 + Math.random() * 0.2,     // ~0.8–1
    speed: 0.35 + Math.random() * 0.7,      // slow rise
    swayAmp: 0.3 + Math.random() * 0.9,
    swayPh: Math.random() * Math.PI * 2,
    swaySpeed: 0.15 + Math.random() * 0.25,
  })), [count, area])

  useFrame((state, dt) => {
    if (!grp.current) return
    const t = state.clock.elapsedTime
    grp.current.children.forEach((m, i) => {
      const d = data[i]
      d.y += d.speed * dt
      if (d.y > halfH) d.y = -halfH
      m.position.y = d.y
      m.position.x = d.x + Math.sin(t * d.swaySpeed + d.swayPh) * d.swayAmp
    })
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

function SceneInner({ cfg, reduce }) {
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
      <Lanterns key={`lanterns-${lanternCount}`} count={lanternCount} />

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
      />
    </>
  )
}

export default function LanternScene({ quality, onQuality }) {
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
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
