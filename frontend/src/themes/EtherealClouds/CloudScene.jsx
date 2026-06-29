// Ethereal Clouds — a LIGHT, heavenly WebGL scene: soft drifting 3D clouds,
// warm gold god-rays from above, and fine sparkle motes. Airy and serene —
// "a wedding in the heavens". Composes the shared cinematic foundation.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CinematicCanvas, DriftPoints, softTexture, cloudTexture } from '../_cinematic/shared.jsx'

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
    scale: 6 + Math.random() * 8,           // ~6–14
    opacity: 0.5 + Math.random() * 0.3,     // ~0.5–0.8
    speed: 0.25 + Math.random() * 0.7,      // slow per-cloud drift
    warm: i % 4 === 0,                       // a few warmer clouds
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
        <sprite key={i} position={[r.x, 0, 0]} scale={[3, 28, 1]} material-rotation={r.angle}>
          <spriteMaterial map={tex} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
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
      {/* big soft warm sun glow, top-center behind everything */}
      <sprite position={[0, 7, -12]} scale={[18, 18, 1]}>
        <spriteMaterial map={sun} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
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
      bg="#eef1f6"
      fog={['#eef1f6', 20, 48]}
      baseZ={12}
      warpTo={7}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
