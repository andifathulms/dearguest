import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

// Soft round sprite for particles / glows (radial-gradient → canvas texture).
function dotTexture(inner = '#fff7df', outer = 'rgba(232,200,121,0)') {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, inner)
  g.addColorStop(0.4, 'rgba(232,200,121,0.85)')
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// Drifting gold dust — additive points rising slowly, gentle swirl.
function GoldDust({ count = 320, reduce }) {
  const ref = useRef()
  const tex = useMemo(() => dotTexture(), [])
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 34
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2
      speeds[i] = 0.25 + Math.random() * 0.6
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, dt) => {
    if (reduce || !ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt * 0.5
      arr[i * 3] += Math.sin(t * 0.2 + i) * dt * 0.04
      if (arr[i * 3 + 1] > 12) arr[i * 3 + 1] = -12
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.rotation.y += dt * 0.012
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.13}
        map={tex}
        color="#e8c879"
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// Glowing crescent moon: a lit sphere occluded by a second dark sphere,
// wrapped in an additive halo billboard.
function Moon() {
  const halo = useMemo(() => dotTexture('#f4ead0', 'rgba(216,192,116,0)'), [])
  return (
    <group position={[5.2, 3.2, -6]}>
      <sprite scale={[9, 9, 1]}>
        <spriteMaterial map={halo} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh>
        <sphereGeometry args={[1.15, 48, 48]} />
        <meshStandardMaterial color="#efe6c8" emissive="#d8c074" emissiveIntensity={0.55} roughness={0.9} />
      </mesh>
      <mesh position={[0.62, 0.18, 0.55]}>
        <sphereGeometry args={[1.08, 48, 48]} />
        <meshBasicMaterial color="#0a1024" />
      </mesh>
    </group>
  )
}

// Camera rig: intro dolly on mount, then lerp toward pointer + scroll parallax.
function Rig({ reduce }) {
  const { camera } = useThree()
  const scroll = useRef(0)
  const intro = useRef(0)
  useEffect(() => {
    const onScroll = () => { scroll.current = window.scrollY || 0 }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useFrame((state, dt) => {
    if (reduce) { camera.position.set(0, 0, 8); camera.lookAt(0, 0, 0); return }
    intro.current = Math.min(1, intro.current + dt * 0.4)
    const ease = 1 - Math.pow(1 - intro.current, 3)
    const baseZ = 12 - 4 * ease // dolly 12 → 8
    const px = state.pointer.x * 0.7
    const py = state.pointer.y * 0.45 - scroll.current * 0.0012
    camera.position.x += (px - camera.position.x) * 0.04
    camera.position.y += (py - camera.position.y) * 0.04
    camera.position.z += (baseZ - camera.position.z) * 0.06
    camera.lookAt(0, 0, 0)
  })
  return null
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const on = () => setReduce(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduce
}

export default function CelestialScene() {
  const reduce = usePrefersReducedMotion()
  return (
    <div className="cc-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduce ? 'demand' : 'always'}
      >
        <color attach="background" args={['#070b1f']} />
        <fog attach="fog" args={['#070b1f', 14, 34]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 4, 2]} intensity={0.8} color="#fbf0c8" />
        <Suspense fallback={null}>
          <Stars radius={90} depth={55} count={reduce ? 1600 : 5200} factor={4.2} saturation={0} fade speed={reduce ? 0 : 0.55} />
          <Stars radius={50} depth={30} count={reduce ? 600 : 1800} factor={2.4} saturation={0.4} fade speed={reduce ? 0 : 0.9} />
          <GoldDust count={reduce ? 70 : 320} reduce={reduce} />
          <Moon />
          <Rig reduce={reduce} />
        </Suspense>
      </Canvas>
    </div>
  )
}
