import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

// ---- canvas-drawn textures (no external assets) ----

// Soft round glow sprite.
function softTexture(color = 'rgba(232,200,121,0.9)') {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, color)
  g.addColorStop(0.5, color.replace(/[\d.]+\)$/, '0.25)'))
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// Elegant crescent moon with a baked-in warm glow (billboard sprite).
function crescentTexture() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  const cx = s * 0.52, cy = s * 0.5, r = s * 0.26
  // warm halo
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.6)
  glow.addColorStop(0, 'rgba(245,236,205,0.5)')
  glow.addColorStop(0.35, 'rgba(216,192,116,0.16)')
  glow.addColorStop(1, 'rgba(216,192,116,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, s, s)
  // moon disc with soft shading
  const disc = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r)
  disc.addColorStop(0, '#fdf6e2')
  disc.addColorStop(1, '#e6d6a4')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  // carve the crescent
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx + r * 0.55, cy - r * 0.16, r * 0.95, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// Shooting-star streak (bright head fading to a tail).
function streakTexture() {
  const w = 128, h = 16
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, 'rgba(255,250,235,0)')
  g.addColorStop(0.75, 'rgba(255,247,223,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0.95)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2 - 2)
  ctx.lineTo(w, h / 2 + 2)
  ctx.closePath()
  ctx.fill()
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// ---- scene objects ----

function Moon() {
  const tex = useMemo(() => crescentTexture(), [])
  return (
    <sprite position={[4.6, 2.9, -6]} scale={[5.2, 5.2, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  )
}

function Nebula() {
  const blue = useMemo(() => softTexture('rgba(70,96,190,0.8)'), [])
  const gold = useMemo(() => softTexture('rgba(216,192,116,0.7)'), [])
  return (
    <group>
      <sprite position={[-7, 2.5, -12]} scale={[24, 24, 1]}>
        <spriteMaterial map={blue} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={[6, -4, -14]} scale={[28, 28, 1]}>
        <spriteMaterial map={gold} transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

function GoldDust({ count = 320, reduce }) {
  const ref = useRef()
  const tex = useMemo(() => softTexture('rgba(245,225,160,0.95)'), [])
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
      <pointsMaterial size={0.12} map={tex} color="#e8c879" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  )
}

function ShootingStar() {
  const ref = useRef()
  const tex = useMemo(() => streakTexture(), [])
  const st = useRef({ active: false, t: 0, next: 3 + Math.random() * 5, x: 0, y: 0, dx: 0, dy: 0 })
  useFrame((_, dt) => {
    if (!ref.current) return
    const s = st.current
    if (!s.active) {
      s.next -= dt
      if (s.next <= 0) {
        s.active = true; s.t = 0
        s.x = -9 + Math.random() * 5; s.y = 3 + Math.random() * 4
        s.dx = 11 + Math.random() * 7; s.dy = -(3 + Math.random() * 2.5)
        ref.current.material.rotation = Math.atan2(s.dy, s.dx)
      }
    } else {
      s.t += dt
      const p = s.t / 0.95
      s.x += s.dx * dt; s.y += s.dy * dt
      ref.current.position.set(s.x, s.y, -3)
      ref.current.material.opacity = Math.sin(Math.min(1, p) * Math.PI) * 0.9
      if (p >= 1) { s.active = false; s.next = 5 + Math.random() * 7 }
    }
  })
  return (
    <sprite ref={ref} scale={[3.4, 0.45, 1]} position={[0, 20, -3]}>
      <spriteMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

// Camera: sits far behind the cover, then warps "through the stars" when the
// guest opens the invitation (`invitation:open`), then settles into gentle
// pointer + scroll parallax.
function Rig({ reduce }) {
  const { camera } = useThree()
  const scroll = useRef(0)
  const open = useRef(false)
  const warp = useRef(0)
  useEffect(() => {
    camera.position.set(0, 0, 18)
    const onScroll = () => { scroll.current = window.scrollY || 0 }
    const onOpen = () => { open.current = true; warp.current = 0 }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('invitation:open', onOpen)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('invitation:open', onOpen)
    }
  }, [camera])

  useFrame((state, dt) => {
    if (reduce) { camera.position.set(0, 0, 8); camera.lookAt(0, 0, 0); return }
    if (open.current && warp.current < 1) warp.current = Math.min(1, warp.current + dt * 0.75)
    const ease = 1 - Math.pow(1 - warp.current, 3)
    const baseZ = open.current ? 18 - 10 * ease : 18 // 18 → 8 after open (push through)
    const px = state.pointer.x * 0.7
    const py = state.pointer.y * 0.45 - scroll.current * 0.0012
    camera.position.x += (px - camera.position.x) * 0.05
    camera.position.y += (py - camera.position.y) * 0.05
    camera.position.z += (baseZ - camera.position.z) * (open.current ? 0.09 : 0.02)
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
        camera={{ position: [0, 0, 18], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduce ? 'demand' : 'always'}
      >
        <color attach="background" args={['#070b1f']} />
        <fog attach="fog" args={['#070b1f', 16, 40]} />
        <ambientLight intensity={0.6} />
        <Suspense fallback={null}>
          <Nebula />
          <Stars radius={90} depth={55} count={reduce ? 1600 : 5200} factor={4.2} saturation={0} fade speed={reduce ? 0 : 0.55} />
          <Stars radius={50} depth={30} count={reduce ? 600 : 1800} factor={2.4} saturation={0.5} fade speed={reduce ? 0 : 0.9} />
          <GoldDust count={reduce ? 70 : 320} reduce={reduce} />
          <Moon />
          {!reduce && <ShootingStar />}
          <Rig reduce={reduce} />
        </Suspense>
      </Canvas>
    </div>
  )
}
