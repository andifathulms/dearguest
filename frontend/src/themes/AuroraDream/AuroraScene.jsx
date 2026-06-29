// Aurora Dream — a dark, dreamy WebGL theme: flowing northern-lights curtains
// in teal → green → violet drifting over a deep night sky full of stars and
// soft gold dust. Built on the shared cinematic foundation. No external assets.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CinematicCanvas, DriftPoints, Bokeh } from '../_cinematic/shared.jsx'

// ---- the aurora: a custom additive shader on large back planes ----

const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float t = uTime;

    // Several flowing vertical "curtains" — sines warped by a slower sine in y
    // so the ribbons wave as they rise. Combine octaves for richness.
    float c1 = sin(vUv.x * 6.0  + t * 0.50 + sin(vUv.y * 3.0 + t * 0.30) * 1.5);
    float c2 = sin(vUv.x * 11.0 - t * 0.35 + sin(vUv.y * 4.5 - t * 0.20) * 1.2);
    float c3 = sin(vUv.x * 3.5  + t * 0.22 + sin(vUv.y * 2.0 + t * 0.40) * 1.8);
    float curtain = (c1 * 0.5 + c2 * 0.3 + c3 * 0.4);

    // Soft vertical streak noise to break the bands into shimmering rays.
    float streak = sin(vUv.x * 40.0 + sin(vUv.y * 8.0 + t * 0.6) * 2.0);
    float intensity = curtain * 0.5 + 0.5 + streak * 0.06;
    intensity = clamp(intensity, 0.0, 1.0);

    // Bright through the middle of the plane (which maps to the centre of the
    // viewport), fading top and bottom — so the aurora reads on the cover, not
    // off-screen above.
    float band = smoothstep(0.05, 0.45, vUv.y) * smoothstep(0.95, 0.55, vUv.y);

    // Color shifts through teal → green → violet driven by the curtain & height.
    vec3 teal   = vec3(0.25, 0.71, 0.63);
    vec3 green  = vec3(0.31, 0.84, 0.55);
    vec3 violet = vec3(0.48, 0.36, 0.75);
    float m1 = smoothstep(-0.2, 0.6, curtain);
    vec3 col = mix(teal, green, m1);
    col = mix(col, violet, smoothstep(0.45, 0.8, vUv.y) * 0.65);

    float alpha = intensity * band * 0.85;
    gl_FragColor = vec4(col * (0.55 + intensity * 0.8), alpha);
  }
`

function AuroraCurtain({ position, rotation, scale, phase = 0, reduce }) {
  const mat = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: phase } }), [phase])
  useFrame((_, dt) => {
    if (!reduce && mat.current) mat.current.uniforms.uTime.value += dt
  })
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function SceneInner({ cfg, reduce }) {
  const stars = Math.round(260 * cfg.mul)
  const starsBright = Math.round(110 * cfg.mul)
  const dust = Math.round(80 * cfg.mul)
  const bokeh = Math.round(8 * cfg.mul)

  return (
    <>
      {/* Two layered aurora curtains at different phase/scale for depth. */}
      <AuroraCurtain
        position={[0, 1, -6.5]}
        rotation={[0, 0, 0.08]}
        scale={[66, 38, 1]}
        phase={0}
        reduce={reduce}
      />
      <AuroraCurtain
        position={[-3, 2.5, -9]}
        rotation={[0, 0, -0.12]}
        scale={[58, 34, 1]}
        phase={2.4}
        reduce={reduce}
      />

      {/* Starfield — a broad dim layer plus a smaller brighter one. */}
      <DriftPoints
        key={`stars-${stars}`}
        count={stars}
        area={[44, 30, 18]}
        size={0.07}
        color="#eaf0ff"
        opacity={0.9}
        rise={0.15}
        reduce={reduce}
      />
      <DriftPoints
        key={`starsB-${starsBright}`}
        count={starsBright}
        area={[40, 26, 14]}
        size={0.11}
        color="#ffffff"
        opacity={0.95}
        rise={0.12}
        reduce={reduce}
      />

      {/* Soft gold dust motes drifting up through the night. */}
      <DriftPoints
        key={`dust-${dust}`}
        count={dust}
        area={[36, 24, 14]}
        size={0.12}
        color="#d8c074"
        opacity={0.7}
        rise={0.45}
        additive
        reduce={reduce}
      />

      {/* Faint aurora-tinted bokeh for atmospheric depth. */}
      <Bokeh
        key={`bokeh-${bokeh}`}
        count={bokeh}
        color="rgba(72,180,150,0.9)"
        area={[26, 18, 8]}
        size={3.2}
        opacity={0.25}
        reduce={reduce}
      />
    </>
  )
}

export default function AuroraScene({ quality, onQuality }) {
  return (
    <CinematicCanvas
      quality={quality}
      onQuality={onQuality}
      bg="#070b1f"
      fog={['#070b1f', 24, 54]}
      baseZ={8.5}
      warpTo={6}
    >
      {({ cfg, reduce }) => <SceneInner cfg={cfg} reduce={reduce} />}
    </CinematicCanvas>
  )
}
