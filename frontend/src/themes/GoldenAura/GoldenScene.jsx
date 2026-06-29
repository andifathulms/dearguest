// "Golden Aura" — a dark, opulent black-gold cinematic scene: floating golden
// bokeh orbs, fine shimmer dust, slowly turning god-rays and a soft central
// glow. Composed entirely from the shared cinematic foundation (no assets).
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CinematicCanvas, Bokeh, DriftPoints, softTexture } from '../_cinematic/shared.jsx'

// Tall, slowly rotating gold light shafts radiating from above. Soft enough to
// keep overlaid text readable.
function GodRays({ reduce }) {
  const group = useRef()
  const tex = useMemo(() => softTexture('rgba(232,200,121,0.9)'), [])
  // Four shafts fanned out around the upper-center pivot.
  const rays = useMemo(() => [-0.5, -0.18, 0.18, 0.5], [])
  useFrame((_, dt) => {
    if (!reduce && group.current) group.current.rotation.z += dt * 0.02
  })
  return (
    <group ref={group} position={[0, 6, -9]}>
      {rays.map((rot, i) => (
        <sprite key={i} rotation={[0, 0, rot]} scale={[3, 26, 1]} position={[0, 0, 0]}>
          <spriteMaterial map={tex} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

// Large, low radial bloom that warms the bottom of the frame.
function CentralGlow() {
  const tex = useMemo(() => softTexture('rgba(232,200,121,0.7)'), [])
  return (
    <sprite scale={[26, 18, 1]} position={[0, -6, -12]}>
      <spriteMaterial map={tex} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

function SceneInner({ cfg, reduce }) {
  // Counts scale with the active quality tier. Each count-bound element is
  // KEYED by its count so a tier change remounts it cleanly — three.js can't
  // resize a buffer attribute in place.
  const bokehBig = Math.round(20 * cfg.mul)
  const bokehSmall = Math.round(10 * cfg.mul)
  const dust = Math.round(280 * cfg.mul)
  return (
    <>
      <CentralGlow />
      <GodRays reduce={reduce} />

      {/* Hero: large soft golden bokeh, plus a brighter, tighter layer for depth. */}
      <Bokeh
        key={'bokeh-' + bokehBig}
        color="rgba(232,200,121,0.95)"
        count={bokehBig}
        size={4}
        opacity={0.5}
        area={[24, 16, 9]}
        reduce={reduce}
      />
      <Bokeh
        key={'bokeh2-' + bokehSmall}
        color="rgba(245,228,170,0.95)"
        count={bokehSmall}
        size={2.2}
        opacity={0.6}
        area={[20, 14, 7]}
        reduce={reduce}
      />

      {/* Fine gold shimmer dust rising through the frame. */}
      <DriftPoints
        key={'dust-' + dust}
        count={dust}
        size={0.1}
        color="#e8c879"
        opacity={0.85}
        rise={0.4}
        additive
        reduce={reduce}
      />
    </>
  )
}

export default function GoldenScene({ quality, onQuality }) {
  return (
    <CinematicCanvas
      quality={quality}
      onQuality={onQuality}
      bg="#0c0c0e"
      fog={['#0c0c0e', 18, 46]}
      baseZ={12}
      warpTo={7}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
