// Enchanted Fireflies — a dark, magical forest-night cinematic theme.
// Warm glowing fireflies drift and blink on independent phases through a
// deep-green mist, with fine gold sparkle and a faint moon-glow filtering in.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CinematicCanvas, DriftPoints, softTexture } from '../_cinematic/shared.jsx'

// Signature element: independently blinking + wandering warm fireflies.
function Fireflies({ count = 70, reduce }) {
  const grp = useRef()
  const tex = useMemo(() => softTexture('rgba(240,232,150,0.95)'), [])
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 30,
    y: (Math.random() - 0.5) * 20,
    z: (Math.random() - 0.5) * 12 - 2,
    s: 0.25 + Math.random() * 0.35,          // 0.25–0.6 varied
    ph: Math.random() * Math.PI * 2,          // blink phase
    blink: 0.6 + Math.random() * 0.9,         // blink speed
    wph: Math.random() * Math.PI * 2,         // wander phase
    wamp: 0.4 + Math.random() * 0.9,          // wander amplitude
    wspd: 0.15 + Math.random() * 0.35,        // wander speed
  })), [count])

  useFrame((state) => {
    if (reduce || !grp.current) return
    const t = state.clock.elapsedTime
    grp.current.children.forEach((m, i) => {
      const d = data[i]
      m.position.x = d.x + Math.sin(t * d.wspd + d.wph) * d.wamp
      m.position.y = d.y + Math.cos(t * d.wspd * 0.8 + d.wph) * d.wamp * 0.7
      const glow = 0.15 + Math.max(0, Math.sin(t * d.blink + d.ph)) * 0.85
      m.material.opacity = glow
    })
  })

  return (
    <group ref={grp}>
      {data.map((d, i) => (
        <sprite key={i} position={[d.x, d.y, d.z]} scale={[d.s, d.s, 1]}>
          <spriteMaterial map={tex} transparent opacity={reduce ? 0.7 : 0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

// Large soft green sprites far back for depth; slow drift.
function GreenMist({ reduce }) {
  const tex = useMemo(() => softTexture('rgba(60,150,90,0.7)'), [])
  const refs = [useRef(), useRef(), useRef()]
  const puffs = useMemo(() => [
    { x: -8, y: 2, z: -12, s: 24, drift: 0.04, ph: 0 },
    { x: 7, y: -3, z: -13, s: 26, drift: 0.035, ph: 2.1 },
    { x: 1, y: 5, z: -14, s: 22, drift: 0.05, ph: 4.2 },
  ], [])
  useFrame((state) => {
    if (reduce) return
    const t = state.clock.elapsedTime
    refs.forEach((r, i) => {
      if (!r.current) return
      const p = puffs[i]
      r.current.position.x = p.x + Math.sin(t * p.drift + p.ph) * 1.4
      r.current.position.y = p.y + Math.cos(t * p.drift * 0.8 + p.ph) * 1.0
    })
  })
  return (
    <group>
      {puffs.map((p, i) => (
        <sprite key={i} ref={refs[i]} position={[p.x, p.y, p.z]} scale={[p.s, p.s, 1]}>
          <spriteMaterial map={tex} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

// A faint moon-glow filtering through the canopy.
function MoonGlow() {
  const tex = useMemo(() => softTexture('rgba(200,220,180,0.7)'), [])
  return (
    <sprite position={[5, 6, -13]} scale={[20, 20, 1]}>
      <spriteMaterial map={tex} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

function SceneInner({ cfg, reduce }) {
  const flyCount = Math.round(70 * cfg.mul)
  const sparkleCount = Math.round(120 * cfg.mul)
  return (
    <>
      <MoonGlow />
      <GreenMist reduce={reduce} />
      {/* key by count so a tier change remounts cleanly */}
      <Fireflies key={`ff-${flyCount}`} count={flyCount} reduce={reduce} />
      <DriftPoints
        key={`sp-${sparkleCount}`}
        count={sparkleCount}
        size={0.07}
        color="#e6d27a"
        opacity={0.7}
        rise={0.3}
        additive
        reduce={reduce}
      />
    </>
  )
}

export default function FireflyScene({ quality, onQuality }) {
  return (
    <CinematicCanvas
      quality={quality}
      onQuality={onQuality}
      bg="#081712"
      fog={['#081712', 22, 52]}
      baseZ={9}
      warpTo={6.5}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
