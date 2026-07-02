// Shared foundation for the Cinematic (WebGL) themes — adaptive quality,
// camera rig with a push-through warp on cover-open, reusable particle
// systems, and canvas-drawn textures. Scenes compose these.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

// ---- quality tiers: start highest, step down only on sustained low FPS ----
// `bloom` is the post-processing glow multiplier for that tier (0 = off).
export const TIERS = {
  high: { mul: 1, dpr: [1, 2], bloom: 1.15 },
  medium: { mul: 0.62, dpr: [1, 1.5], bloom: 0.7 },
  low: { mul: 0.34, dpr: [1, 1], bloom: 0 },
}
const REDUCED = { mul: 0.22, dpr: [1, 1], bloom: 0 }
const ORDER = ['low', 'medium', 'high']
export const step = (q, d) => ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(q) + d))]

export function usePrefersReducedMotion() {
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

// ---- canvas textures ----
export function softTexture(color = 'rgba(255,255,255,0.95)') {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, color)
  g.addColorStop(0.45, color.replace(/[\d.]+\)$/, '0.25)'))
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// A soft petal/leaf shape (teardrop) in the given fill.
export function petalTexture(fill = '#f3c0cd', vein = 'rgba(255,255,255,0.35)') {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(s * 0.5, 0, s * 0.5, s)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.4, fill)
  grad.addColorStop(1, fill)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(s * 0.5, s * 0.08)
  ctx.bezierCurveTo(s * 0.92, s * 0.34, s * 0.86, s * 0.86, s * 0.5, s * 0.95)
  ctx.bezierCurveTo(s * 0.14, s * 0.86, s * 0.08, s * 0.34, s * 0.5, s * 0.08)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = vein
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(s * 0.5, s * 0.16)
  ctx.lineTo(s * 0.5, s * 0.9)
  ctx.stroke()
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// A fluffy cloud puff.
export function cloudTexture(tint = 'rgba(255,255,255,0.9)') {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  for (let i = 0; i < 22; i++) {
    const x = s * (0.25 + Math.random() * 0.5)
    const y = s * (0.4 + Math.random() * 0.3)
    const r = s * (0.12 + Math.random() * 0.16)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, tint)
    g.addColorStop(1, tint.replace(/[\d.]+\)$/, '0)'))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.needsUpdate = true
  return t
}

// ---- particle systems ----

// Petals/leaves/snow: instanced planes that fall, sway and tumble.
export function FallingParticles({ texture, count = 220, area = [34, 26, 14], fallSpeed = 1.2, size = 0.5, color = '#ffffff', opacity = 0.92, reduce }) {
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * area[0],
    y: (Math.random() - 0.5) * area[1],
    z: (Math.random() - 0.5) * area[2] - 2,
    rot: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 1.3,
    sway: Math.random() * Math.PI * 2,
    swayAmp: 0.3 + Math.random() * 0.7,
    fall: fallSpeed * (0.55 + Math.random() * 0.9),
    scale: size * (0.55 + Math.random() * 0.9),
  })), [count, area, fallSpeed, size])

  const place = (t = 0) => {
    if (!ref.current) return
    data.forEach((d, i) => {
      const x = d.x + Math.sin(t * 0.5 + d.sway) * d.swayAmp
      dummy.position.set(x, d.y, d.z)
      dummy.rotation.set(d.rot * 0.6, d.rot, d.rot * 0.3)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => { place(0) })

  useFrame((state, dt) => {
    if (reduce || !ref.current) return
    data.forEach((d) => {
      d.y -= d.fall * dt
      if (d.y < -area[1] / 2) d.y = area[1] / 2
      d.rot += d.rotSpeed * dt
    })
    place(state.clock.elapsedTime)
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  )
}

// Drifting points (dust / sparkles / distant bokeh). Points gently drift, the
// cloud slowly rolls, and the whole field twinkles (size/opacity breathe) for
// a lively, premium shimmer — especially under bloom.
export function DriftPoints({ count = 300, area = [36, 26, 16], size = 0.12, color = '#ffffff', opacity = 0.9, rise = 0.5, texture, reduce, additive = true, twinkle = true }) {
  const ref = useRef()
  const tex = useMemo(() => texture || softTexture('rgba(255,255,255,0.95)'), [texture])
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area[0]
      positions[i * 3 + 1] = (Math.random() - 0.5) * area[1]
      positions[i * 3 + 2] = (Math.random() - 0.5) * area[2] - 2
      speeds[i] = 0.25 + Math.random() * 0.7
    }
    return { positions, speeds }
  }, [count, area])
  useFrame((state, dt) => {
    if (reduce || !ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * dt * rise
      arr[i * 3] += Math.sin(t * 0.25 + i) * dt * 0.07
      if (arr[i * 3 + 1] > area[1] / 2) arr[i * 3 + 1] = -area[1] / 2
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.rotation.z += dt * 0.012
    if (twinkle) {
      ref.current.material.size = size * (1 + Math.sin(t * 2.1) * 0.18)
      ref.current.material.opacity = opacity * (0.82 + Math.abs(Math.sin(t * 1.3)) * 0.18)
    }
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={size} map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} sizeAttenuation />
    </points>
  )
}

// Large soft bokeh orbs that drift and pulse.
export function Bokeh({ count = 14, color = 'rgba(232,200,121,0.9)', area = [22, 16, 8], size = 3.4, opacity = 0.5, reduce }) {
  const grp = useRef()
  const tex = useMemo(() => softTexture(color), [color])
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * area[0],
    y: (Math.random() - 0.5) * area[1],
    z: (Math.random() - 0.5) * area[2] - 4,
    s: size * (0.5 + Math.random()),
    ph: Math.random() * Math.PI * 2,
    drift: 0.2 + Math.random() * 0.3,
  })), [count, area, size])
  useFrame((state) => {
    if (!grp.current) return
    const t = state.clock.elapsedTime
    grp.current.children.forEach((m, i) => {
      const d = data[i]
      if (!reduce) {
        m.position.x = d.x + Math.sin(t * d.drift + d.ph) * 1.1
        m.position.y = d.y + Math.cos(t * d.drift * 0.8 + d.ph) * 0.8
      }
      const p = reduce ? 1 : 0.85 + Math.sin(t * 0.8 + d.ph) * 0.15
      m.scale.setScalar(d.s * p)
    })
  })
  return (
    <group ref={grp}>
      {data.map((d, i) => (
        <sprite key={i} position={[d.x, d.y, d.z]} scale={[d.s, d.s, 1]}>
          <spriteMaterial map={tex} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

// Camera: distant during the cover, warps in on `invitation:open`, then gentle
// pointer + scroll parallax + auto-drift.
export function Rig({ reduce, baseZ = 12, warpTo = 7 }) {
  const { camera } = useThree()
  const scroll = useRef(0)
  const open = useRef(false)
  const warp = useRef(0)
  useEffect(() => {
    camera.position.set(0, 0, baseZ)
    const onScroll = () => { scroll.current = window.scrollY || 0 }
    const onOpen = () => { open.current = true; warp.current = 0 }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('invitation:open', onOpen)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('invitation:open', onOpen)
    }
  }, [camera, baseZ])
  useFrame((state, dt) => {
    if (reduce) { camera.position.set(0, 0, warpTo); camera.lookAt(0, 0, 0); return }
    if (open.current && warp.current < 1) warp.current = Math.min(1, warp.current + dt * 0.7)
    const ease = 1 - Math.pow(1 - warp.current, 3)
    const z = open.current ? baseZ - (baseZ - warpTo) * ease : baseZ
    const t = state.clock.elapsedTime
    // Noticeable, living parallax: a wider continuous drift plus pointer/scroll.
    const px = state.pointer.x * 0.95 + Math.sin(t * 0.11) * 0.85
    const py = state.pointer.y * 0.6 - scroll.current * 0.0014 + Math.cos(t * 0.08) * 0.5
    camera.position.x += (px - camera.position.x) * 0.045
    camera.position.y += (py - camera.position.y) * 0.045
    camera.position.z += (z - camera.position.z) * (open.current ? 0.08 : 0.03)
    camera.lookAt(0, 0, 0)
  })
  return null
}

// Wrapper that wires up the adaptive canvas. `children` is a render function
// receiving { cfg, reduce } so the scene can scale particle counts by cfg.mul.
export function CinematicCanvas({ quality = 'high', onQuality, bg = '#070b1f', fog, baseZ = 12, warpTo = 7, lights, bloom = 1, bloomThreshold = 0.22, children }) {
  const reduce = usePrefersReducedMotion()
  const cfg = reduce ? REDUCED : TIERS[quality]
  const bloomOn = !reduce && bloom > 0 && cfg.bloom > 0
  return (
    <div className="cc-canvas" aria-hidden="true">
      <Canvas
        dpr={cfg.dpr}
        camera={{ position: [0, 0, baseZ], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduce ? 'demand' : 'always'}
      >
        <color attach="background" args={[bg]} />
        {fog && <fog attach="fog" args={fog} />}
        <ambientLight intensity={0.7} />
        {lights}
        {!reduce && onQuality && (
          <PerformanceMonitor
            onDecline={() => onQuality((q) => step(q, -1))}
            onIncline={() => onQuality((q) => step(q, +1))}
            flipflops={3}
            onFallback={() => onQuality('low')}
          />
        )}
        <Suspense fallback={null}>
          {children({ cfg, reduce })}
          <Rig reduce={reduce} baseZ={baseZ} warpTo={warpTo} />
        </Suspense>
        {/* Post-processing glow — the biggest premium lift; tier-gated off on
            low/reduced so weak devices skip the cost entirely. */}
        {bloomOn && (
          <EffectComposer disableNormalPass>
            <Bloom mipmapBlur intensity={bloom * cfg.bloom} luminanceThreshold={bloomThreshold} luminanceSmoothing={0.5} radius={0.72} />
            <Vignette eskil={false} offset={0.28} darkness={0.42} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}
