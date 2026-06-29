import { lazy, Suspense } from 'react'
import CoverGate from '../components/ui/CoverGate.jsx'

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
}

// Themes that reuse another theme's cover-gate styling need that theme's class
// on the cover too (the cover-gate selectors are scoped per theme).
const COVER_CLASS = {
  'celestial-cinematic': 'midnight-celestial celestial-cinematic',
  'petals-3d': 'floral-light petals-3d cc-root',
  'aurora-3d': 'midnight-celestial aurora-3d cc-root',
  'golden-3d': 'deco-noir golden-3d cc-root',
  'clouds-3d': 'ivory-classic clouds-3d cc-root',
}

export default function ThemeRenderer({ invitation, guestName, preview = false }) {
  const themeKey = themes[invitation.theme] ? invitation.theme : 'javanese-dark'
  const Theme = themes[themeKey]

  return (
    <>
      {/* Editor preview renders the content directly, skipping the cover gate. */}
      {!preview && <CoverGate invitation={invitation} guestName={guestName} themeClass={COVER_CLASS[themeKey] || themeKey} />}
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <Theme invitation={invitation} guestName={guestName} />
      </Suspense>
    </>
  )
}
