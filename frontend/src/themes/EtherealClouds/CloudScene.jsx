// Ethereal Clouds — a LIGHT, heavenly WebGL scene: soft drifting 3D clouds,
// warm gold god-rays from above, and fine sparkle motes. Airy and serene —
// "a wedding in the heavens". Composes the shared cinematic foundation.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CinematicCanvas, DriftPoints, softTexture, cloudTexture } from '../_cinematic/shared.jsx'

// A graduated sky (soft blue top → warm cream bottom) painted on a big backdrop
// plane. Without it, white clouds on a near-white background have no contrast.
function skyTexture() {
  const c = document.createElement('canvas')
  c.width = 4; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#a7c2e8')   // soft blue zenith
  g.addColorStop(0.42, '#cadcf0')
  g.addColorStop(0.72, '#eaeef0')
  g.addColorStop(1, '#f7ecda')   // warm horizon
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

// ---- signature: soft billowy clouds that drift across and wrap at the edges ----
function Clouds({ count }) {
  const grp = useRef()
  const white = useMemo(() => cloudTexture('rgba(255,255,255,0.95)'), [])
  const warm = useMemo(() => cloudTexture('rgba(255,244,226,0.9)'), [])
  const area = useMemo(() => [40, 20, 18], [])
  const halfW = area[0] / 2 + 9 // padding so clouds wrap fully off-screen

  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (Math.random() - 0.5) * area[0],
    y: (Math.random() - 0.5) * area[1],
    z: (Math.random() - 0.5) * area[2] - 4,
    scale: 8 + Math.random() * 9,           // ~8–17 (bigger, more present)
    opacity: 0.78 + Math.random() * 0.2,    // ~0.78–0.98 (opaque enough to read)
    speed: 0.25 + Math.random() * 0.7,      // slow per-cloud drift
    warm: i % 3 === 0,                       // more warm clouds for variety
    bob: Math.random() * Math.PI * 2,
  })), [count, area])

  useFrame((state, dt) => {
    if (!grp.current) return
    const t = state.clock.elapsedTime
    grp.current.children.forEach((m, i) => {
      const d = data[i]
      d.x += d.speed * dt
      if (d.x > halfW) d.x = -halfW
      m.position.x = d.x
      m.position.y = d.y + Math.sin(t * 0.18 + d.bob) * 0.35
    })
  })

  return (
    <group ref={grp}>
      {data.map((d, i) => (
        <sprite key={i} position={[d.x, d.y, d.z]} scale={[d.scale * 1.4, d.scale, 1]}>
          <spriteMaterial
            map={d.warm ? warm : white}
            transparent
            opacity={d.opacity}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

// ---- warm god-rays streaming down from the top, gently rotating ----
function GodRays({ reduce }) {
  const grp = useRef()
  const tex = useMemo(() => softTexture('rgba(255,228,176,0.85)'), [])
  const rays = useMemo(() => [
    { x: -3.2, angle: 0.18 },
    { x: -0.8, angle: -0.06 },
    { x: 1.6, angle: 0.1 },
    { x: 3.8, angle: -0.16 },
  ], [])
  useFrame((_, dt) => {
    if (reduce || !grp.current) return
    grp.current.rotation.z += dt * 0.015
  })
  return (
    <group ref={grp} position={[0, 8, -10]}>
      {rays.map((r, i) => (
        <sprite key={i} position={[r.x, 0, 0]} scale={[3.2, 30, 1]} material-rotation={r.angle}>
          <spriteMaterial map={tex} transparent opacity={0.24} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

function SceneInner({ cfg, reduce }) {
  const cloudCount = Math.round(10 * cfg.mul)
  const moteCount = Math.round(140 * cfg.mul)
  const sun = useMemo(() => softTexture('rgba(255,238,205,0.9)'), [])

  return (
    <>
      {/* graduated sky so the clouds have something to read against */}
      <SkyBackdrop />

      {/* big soft warm sun glow, top-center */}
      <sprite position={[0, 7, -13]} scale={[20, 20, 1]}>
        <spriteMaterial map={sun} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      <GodRays reduce={reduce} />

      {/* signature drifting clouds — keyed by count (buffers can't resize) */}
      <Clouds key={`clouds-${cloudCount}`} count={cloudCount} />

      {/* fine warm sparkle motes rising through the scene */}
      <DriftPoints
        key={`motes-${moteCount}`}
        count={moteCount}
        size={0.09}
        color="#f3e3c0"
        opacity={0.8}
        rise={0.25}
        additive
        reduce={reduce}
      />
    </>
  )
}

export default function CloudScene({ quality, onQuality }) {
  return (
    <CinematicCanvas
      quality={quality}
      onQuality={onQuality}
      bg="#cadcf0"
      fog={['#dbe7f2', 28, 60]}
      baseZ={9}
      warpTo={6.5}
      bloom={0}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
