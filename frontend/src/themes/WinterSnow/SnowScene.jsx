// Winter Snow — a LIGHT, serene WebGL scene: soft white snow gently falling over
// a cool blue twilight sky, with a hazy winter sun glow and fine ice sparkle.
// Composes the shared cinematic foundation.
import { useMemo } from 'react'
import * as THREE from 'three'
import { CinematicCanvas, FallingParticles, DriftPoints, softTexture } from '../_cinematic/shared.jsx'

// A graduated winter sky (cool deep-blue zenith → pale blue-white horizon) painted
// on a big backdrop plane. Without it, white snow on a near-white background has
// no contrast — the snow reads against the blue.
function skyTexture() {
  const c = document.createElement('canvas')
  c.width = 4; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#5b7fb0')   // cool deep-blue zenith
  g.addColorStop(0.5, '#9dbde0') // soft blue
  g.addColorStop(1, '#e8f0f8')   // pale blue-white horizon
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

function SceneInner({ cfg, reduce }) {
  const snowFar = Math.round(240 * cfg.mul)
  const snowNear = Math.round(130 * cfg.mul)
  const sparkleCount = Math.round(120 * cfg.mul)

  const flake = useMemo(() => softTexture('rgba(255,255,255,0.98)'), [])
  const sun = useMemo(() => softTexture('rgba(255,255,255,0.9)'), [])

  return (
    <>
      {/* graduated winter sky so the white snow has something to read against */}
      <SkyBackdrop />

      {/* soft hazy winter sun / glow, upper area */}
      <sprite position={[3, 7, -13]} scale={[20, 20, 1]}>
        <spriteMaterial map={sun} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* signature: two layers of falling snow — keyed by count (buffers can't resize) */}
      <FallingParticles
        key={`snow-far-${snowFar}`}
        texture={flake}
        count={snowFar}
        size={0.42}
        fallSpeed={1.0}
        color="#ffffff"
        opacity={0.95}
        area={[40, 28, 16]}
        reduce={reduce}
      />
      <FallingParticles
        key={`snow-near-${snowNear}`}
        texture={flake}
        count={snowNear}
        size={0.6}
        fallSpeed={1.6}
        color="#ffffff"
        opacity={0.9}
        area={[40, 28, 16]}
        reduce={reduce}
      />

      {/* fine ice sparkle drifting upward through the scene */}
      <DriftPoints
        key={`sparkle-${sparkleCount}`}
        count={sparkleCount}
        size={0.06}
        color="#dbeaff"
        opacity={0.7}
        rise={0.15}
        additive
        reduce={reduce}
      />
    </>
  )
}

export default function SnowScene({ quality, onQuality }) {
  return (
    <CinematicCanvas
      quality={quality}
      onQuality={onQuality}
      bg="#b9cfe6"
      fog={['#c6d8ec', 28, 60]}
      baseZ={9}
      warpTo={6.5}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
