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
    <group ref={group} position={[0, 4.5, -8]}>
      {rays.map((rot, i) => (
        <sprite key={i} rotation={[0, 0, rot]} scale={[3.4, 28, 1]} position={[0, 0, 0]}>
          <spriteMaterial map={tex} transparent opacity={0.26} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

// Large, low radial bloom that warms the bottom of the frame.
function CentralGlow() {
  const tex = useMemo(() => softTexture('rgba(232,200,121,0.7)'), [])
  return (
    <sprite scale={[28, 20, 1]} position={[0, -5, -11]}>
      <spriteMaterial map={tex} transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
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
        color="rgba(236,206,128,0.98)"
        count={bokehBig}
        size={5}
        opacity={0.72}
        area={[22, 15, 8]}
        reduce={reduce}
      />
      <Bokeh
        key={'bokeh2-' + bokehSmall}
        color="rgba(247,232,178,0.98)"
        count={bokehSmall}
        size={2.8}
        opacity={0.85}
        area={[19, 13, 6]}
        reduce={reduce}
      />

      {/* Fine gold shimmer dust rising through the frame. */}
      <DriftPoints
        key={'dust-' + dust}
        count={dust}
        size={0.14}
        color="#e8c879"
        opacity={0.9}
        rise={0.5}
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
      fog={['#0c0c0e', 24, 56]}
      baseZ={8.5}
      warpTo={6}
      bloom={1.4}
      bloomThreshold={0.12}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
