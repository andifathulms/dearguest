import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Line } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

// ---- canvas-drawn textures (no external assets) ----

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

function crescentTexture() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  const cx = s * 0.52, cy = s * 0.5, r = s * 0.26
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.7)
  glow.addColorStop(0, 'rgba(245,236,205,0.55)')
  glow.addColorStop(0.32, 'rgba(216,192,116,0.18)')
  glow.addColorStop(1, 'rgba(216,192,116,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, s, s)
  const disc = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.15, cx, cy, r)
  disc.addColorStop(0, '#fdf6e2')
  disc.addColorStop(1, '#e6d6a4')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx + r * 0.55, cy - r * 0.16, r * 0.95, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

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
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2 - 2); ctx.lineTo(w, h / 2 + 2); ctx.closePath()
  ctx.fill()
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// ---- scene objects ----

function Moon() {
  const ref = useRef()
  const tex = useMemo(() => crescentTexture(), [])
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.y = 3.1 + Math.sin(t * 0.25) * 0.18      // gentle bob
    const s = 5.4 + Math.sin(t * 0.6) * 0.12                       // subtle glow pulse
    ref.current.scale.set(s, s, 1)
  })
  return (
    <sprite ref={ref} position={[4.7, 3.1, -6]} scale={[5.4, 5.4, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  )
}

function Nebula() {
  const blue = useMemo(() => softTexture('rgba(70,96,190,0.8)'), [])
  const gold = useMemo(() => softTexture('rgba(216,192,116,0.7)'), [])
  const a = useRef(), b = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (a.current) a.current.position.x = -7 + Math.sin(t * 0.05) * 1.2
    if (b.current) b.current.position.x = 6 + Math.cos(t * 0.04) * 1.2
  })
  return (
    <group>
      <sprite ref={a} position={[-7, 2.5, -12]} scale={[24, 24, 1]}>
        <spriteMaterial map={blue} transparent opacity={0.17} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={b} position={[6, -4, -14]} scale={[28, 28, 1]}>
        <spriteMaterial map={gold} transparent opacity={0.09} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

// A real 3D constellation: gold lines connecting glowing vertex stars.
function Constellation({ position = [0, 0, 0], scale = 1, shape }) {
  const pts = useMemo(() => shape.map(p => new THREE.Vector3(p[0] * scale, p[1] * scale, p[2] * scale)), [shape, scale])
  const star = useMemo(() => softTexture('rgba(245,236,205,0.95)'), [])
  return (
    <group position={position}>
      <Line points={pts} color="#d8c074" lineWidth={1} transparent opacity={0.3} />
      {pts.map((p, i) => (
        <sprite key={i} position={p} scale={[0.5, 0.5, 1]}>
          <spriteMaterial map={star} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

const CASSIOPEIA = [[-2.1, 0.5, 0], [-1, -0.35, 0], [0, 0.5, 0], [1.05, -0.3, 0], [2.1, 0.55, 0]]
const DIPPER = [[-1.6, 0.5, 0], [-0.6, 0.75, 0], [0.4, 0.55, 0], [1.25, 0.15, 0], [0.45, -0.25, 0], [-0.5, -0.05, 0], [-1.6, 0.5, 0]]

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
      arr[i * 3] += Math.sin(t * 0.2 + i) * dt * 0.05
      if (arr[i * 3 + 1] > 12) arr[i * 3 + 1] = -12
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.13} map={tex} color="#e8c879" transparent opacity={0.92} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  )
}

function ShootingStar() {
  const ref = useRef()
  const tex = useMemo(() => streakTexture(), [])
  const st = useRef({ active: false, t: 0, next: 2 + Math.random() * 4, x: 0, y: 0, dx: 0, dy: 0 })
  useFrame((_, dt) => {
    if (!ref.current) return
    const s = st.current
    if (!s.active) {
      s.next -= dt
      if (s.next <= 0) {
        s.active = true; s.t = 0
        s.x = -10 + Math.random() * 6; s.y = 2 + Math.random() * 5
        s.dx = 12 + Math.random() * 8; s.dy = -(3 + Math.random() * 3)
        ref.current.material.rotation = Math.atan2(s.dy, s.dx)
      }
    } else {
      s.t += dt
      const p = s.t / 0.9
      s.x += s.dx * dt; s.y += s.dy * dt
      ref.current.position.set(s.x, s.y, -3)
      ref.current.material.opacity = Math.sin(Math.min(1, p) * Math.PI) * 0.95
      if (p >= 1) { s.active = false; s.next = 4 + Math.random() * 6 }
    }
  })
  return (
    <sprite ref={ref} scale={[3.6, 0.5, 1]} position={[0, 20, -3]}>
      <spriteMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

// The whole night sky slowly wheels around the celestial pole.
function SkyGroup({ reduce, children }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (reduce || !ref.current) return
    ref.current.rotation.z += dt * 0.006
    ref.current.rotation.y += dt * 0.004
  })
  return <group ref={ref}>{children}</group>
}

// Camera: distant during the cover, then warps "through the stars" when the
// guest opens the invitation; gentle pointer + scroll parallax + auto-drift.
function Rig({ reduce }) {
  const { camera } = useThree()
  const scroll = useRef(0)
  const open = useRef(false)
  const warp = useRef(0)
  useEffect(() => {
    camera.position.set(0, 0, 12)
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
    if (open.current && warp.current < 1) warp.current = Math.min(1, warp.current + dt * 0.7)
    const ease = 1 - Math.pow(1 - warp.current, 3)
    const baseZ = open.current ? 12 - 5 * ease : 12 // 12 → 7 on open (push through)
    const t = state.clock.elapsedTime
    const driftX = Math.sin(t * 0.08) * 0.5
    const driftY = Math.cos(t * 0.06) * 0.3
    const px = state.pointer.x * 0.7 + driftX
    const py = state.pointer.y * 0.45 - scroll.current * 0.0012 + driftY
    camera.position.x += (px - camera.position.x) * 0.04
    camera.position.y += (py - camera.position.y) * 0.04
    camera.position.z += (baseZ - camera.position.z) * (open.current ? 0.08 : 0.03)
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
        <fog attach="fog" args={['#070b1f', 16, 42]} />
        <ambientLight intensity={0.6} />
        <Suspense fallback={null}>
          <Nebula />
          <SkyGroup reduce={reduce}>
            <Stars radius={90} depth={55} count={reduce ? 1600 : 5200} factor={4.2} saturation={0} fade speed={reduce ? 0 : 0.55} />
            <Stars radius={50} depth={30} count={reduce ? 600 : 1800} factor={2.4} saturation={0.5} fade speed={reduce ? 0 : 0.9} />
            <GoldDust count={reduce ? 70 : 320} reduce={reduce} />
            <Constellation position={[-6.5, 3.6, -7]} scale={1.25} shape={CASSIOPEIA} />
            <Constellation position={[6.4, -3.4, -8]} scale={1.05} shape={DIPPER} />
          </SkyGroup>
          <Moon />
          {!reduce && <ShootingStar />}
          <Rig reduce={reduce} />
        </Suspense>
      </Canvas>
    </div>
  )
}
