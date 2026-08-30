import { lazy, Suspense, useEffect, useState } from 'react'
import CoverGate from '../components/ui/CoverGate.jsx'
import SilentBoundary from '../components/ui/SilentBoundary.jsx'
import { MotionClockProvider } from '../motion/MotionClockContext.jsx'

// Each theme (and its CSS) is a separate chunk — an invitation loads only
// the one theme it uses.
const themes = {
  'javanese-dark': lazy(() => import('./JavaneseDark/index.jsx')),
  'floral-light': lazy(() => import('./FloralLight/index.jsx')),
  'modern-minimalist': lazy(() => import('./ModernMinimalist/index.jsx')),
  'luxury-emerald': lazy(() => import('./LuxuryEmerald/index.jsx')),
  'rustic-kraft': lazy(() => import('./RusticKraft/index.jsx')),
  'boho-terracotta': lazy(() => import('./BohoTerracotta/index.jsx')),
  'burgundy-gold': lazy(() => import('./BurgundyGold/index.jsx')),
  'dusty-blue': lazy(() => import('./DustyBlue/index.jsx')),
  'buginese-blue': lazy(() => import('./BugineseBlue/index.jsx')),
  'midnight-celestial': lazy(() => import('./MidnightCelestial/index.jsx')),
  'sage-botanical': lazy(() => import('./SageBotanical/index.jsx')),
  'mauve-rose': lazy(() => import('./MauveRose/index.jsx')),
  'ivory-classic': lazy(() => import('./IvoryClassic/index.jsx')),
  'tropical-green': lazy(() => import('./TropicalGreen/index.jsx')),
  'lavender-dream': lazy(() => import('./LavenderDream/index.jsx')),
  'coral-peach': lazy(() => import('./CoralPeach/index.jsx')),
  'charcoal-marble': lazy(() => import('./CharcoalMarble/index.jsx')),
  'islamic-arabesque': lazy(() => import('./IslamicArabesque/index.jsx')),
  'navy-gold': lazy(() => import('./NavyGold/index.jsx')),
  'plum-gold': lazy(() => import('./PlumGold/index.jsx')),
  'teal-ocean': lazy(() => import('./TealOcean/index.jsx')),
  'deco-noir': lazy(() => import('./DecoNoir/index.jsx')),
  'sunflower-mustard': lazy(() => import('./SunflowerMustard/index.jsx')),
  'beige-korean': lazy(() => import('./BeigeKorean/index.jsx')),
  'rose-gold': lazy(() => import('./RoseGold/index.jsx')),
  'mono-editorial': lazy(() => import('./MonoEditorial/index.jsx')),
  'royal-purple': lazy(() => import('./RoyalPurple/index.jsx')),
  'marble-white': lazy(() => import('./MarbleWhite/index.jsx')),
  'celestial-cinematic': lazy(() => import('./CelestialCinematic/index.jsx')),
  'petals-3d': lazy(() => import('./EnchantedPetals/index.jsx')),
  'aurora-3d': lazy(() => import('./AuroraDream/index.jsx')),
  'golden-3d': lazy(() => import('./GoldenAura/index.jsx')),
  'clouds-3d': lazy(() => import('./EtherealClouds/index.jsx')),
  'lanterns-3d': lazy(() => import('./FloatingLanterns/index.jsx')),
  'fireflies-3d': lazy(() => import('./EnchantedFireflies/index.jsx')),
  'snow-3d': lazy(() => import('./WinterSnow/index.jsx')),
}

// Themes that reuse another theme's cover-gate styling need that theme's class
// on the cover too (the cover-gate selectors are scoped per theme).
const COVER_CLASS = {
  'celestial-cinematic': 'midnight-celestial celestial-cinematic cc-root',
  'petals-3d': 'floral-light petals-3d cc-root',
  'aurora-3d': 'midnight-celestial aurora-3d cc-root',
  'golden-3d': 'deco-noir golden-3d cc-root',
  'clouds-3d': 'ivory-classic clouds-3d cc-root',
  'lanterns-3d': 'navy-gold lanterns-3d cc-root',
  'fireflies-3d': 'luxury-emerald fireflies-3d cc-root',
  'snow-3d': 'dusty-blue snow-3d cc-root',
}

// Themes that mount a shared Remotion frame clock, and what each opts into.
//
// `clock-only` mounts a hidden Player as nothing but a frame source: the WebGL
// themes already render themselves with three.js, and what they gain from
// Remotion is a deterministic, seekable clock rather than a second renderer.
const MOTION_CLOCK = {
  'javanese-dark': {
    composition: 'javanese-backdrop',
    features: { cover: true, story: true, gallery: true },
  },
  'lanterns-3d': {
    composition: 'clock-only',
    features: {},
  },
}

// Every theme is a separate lazy chunk, so a stale hash after a deploy — the
// classic trigger — rejects the import. Without a boundary that propagates past
// Suspense and unmounts the whole invitation, leaving a blank page. A reload
// fetches the current manifest, which is the actual fix.
function ThemeUnavailable() {
  return (
    <div className="inv-status">
      <div className="inv-status-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </div>
      <p className="inv-status-title">Undangan gagal dimuat.</p>
      <button className="inv-status-link" type="button" onClick={() => window.location.reload()}>
        Muat ulang
      </button>
    </div>
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

export default function ThemeRenderer({ invitation, guestName, preview = false }) {
  const themeKey = themes[invitation.theme] ? invitation.theme : 'javanese-dark'
  const Theme = themes[themeKey]
  const reducedMotion = usePrefersReducedMotion()

  // One decision point for the whole invitation: no clock means no motion
  // layer anywhere, and every consumer degrades to its ordinary CSS/Framer
  // behaviour on its own.
  const motionConfig = reducedMotion ? null : MOTION_CLOCK[themeKey] || null

  return (
    <MotionClockProvider config={motionConfig}>
      {/* Editor preview renders the content directly, skipping the cover gate. */}
      {/* Every classic (non-WebGL) theme carries the luxe finish layer. */}
      {!preview && (
        <CoverGate
          invitation={invitation}
          guestName={guestName}
          themeClass={COVER_CLASS[themeKey] || `${themeKey} lx-root`}
        />
      )}
      <SilentBoundary fallback={<ThemeUnavailable />}>
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Theme invitation={invitation} guestName={guestName} />
        </Suspense>
      </SilentBoundary>
    </MotionClockProvider>
  )
}
