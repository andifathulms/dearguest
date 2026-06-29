// Enchanted Petals — a LIGHT, romantic WebGL scene: cherry-blossom / rose
// petals drifting down over a soft blush sky, with dreamy bokeh, fine sparkle
// and a warm sun-glow. Composed entirely from the shared cinematic foundation.
import { useMemo } from 'react'
import * as THREE from 'three'
import {
  CinematicCanvas,
  FallingParticles,
  Bokeh,
  DriftPoints,
  softTexture,
  petalTexture,
} from '../_cinematic/shared.jsx'

function SceneInner({ cfg, reduce }) {
  // Petal textures (canvas-drawn, no external assets).
  const deepPetal = useMemo(() => petalTexture('#e89aad'), [])
  const softPetal = useMemo(() => petalTexture('#f7cdd6', 'rgba(255,255,255,0.4)'), [])
  const sunGlow = useMemo(() => softTexture('rgba(255,236,210,0.8)'), [])

  // Particle counts scale with the adaptive quality factor; keys include the
  // count so a tier change REMOUNTS the element (three.js can't resize buffers).
  const deepCount = Math.round(170 * cfg.mul)
  const softCount = Math.round(120 * cfg.mul)
  const bokehCount = Math.round(14 * cfg.mul)
  const sparkleCount = Math.round(160 * cfg.mul)

  return (
    <>
      {/* warm sun-glow, top-right, behind everything */}
      <sprite position={[5, 5, -10]} scale={[14, 14, 1]}>
        <spriteMaterial map={sunGlow} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* dreamy blush bokeh orbs */}
      <Bokeh
        key={'bokeh-' + bokehCount}
        color="rgba(255,214,224,0.9)"
        count={bokehCount}
        size={3.6}
        opacity={0.42}
        reduce={reduce}
      />

      {/* deeper pink petal layer */}
      <FallingParticles
        key={'petalA-' + deepCount}
        texture={deepPetal}
        count={deepCount}
        size={0.55}
        fallSpeed={1.1}
        area={[34, 26, 14]}
        opacity={0.92}
        reduce={reduce}
      />

      {/* soft light-pink petal layer */}
      <FallingParticles
        key={'petalB-' + softCount}
        texture={softPetal}
        count={softCount}
        size={0.42}
        fallSpeed={1.4}
        area={[34, 26, 14]}
        color="#ffffff"
        opacity={0.85}
        reduce={reduce}
      />

      {/* fine white sparkle drifting up gently */}
      <DriftPoints
        key={'sparkle-' + sparkleCount}
        count={sparkleCount}
        size={0.08}
        color="#fff4f6"
        opacity={0.8}
        rise={0.2}
        reduce={reduce}
      />
    </>
  )
}

export default function PetalScene({ quality, onQuality }) {
  return (
    <CinematicCanvas
      quality={quality}
      onQuality={onQuality}
      bg="#fbeef0"
      fog={['#fbeef0', 18, 46]}
      baseZ={12}
      warpTo={7}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
