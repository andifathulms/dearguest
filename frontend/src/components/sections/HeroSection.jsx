import { motion } from 'framer-motion'
import { formatDateOnly } from '../../utils/dates.js'
import { usePack } from '../../themes/packs/_system/ThemeContext.jsx'
import ThemeAsset from '../../themes/packs/_system/ThemeAsset.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'
import { blessingFor, scriptureFor } from '../../copy/copy.js'
import { QuranCredit } from './ScriptureSection.jsx'

// In a theme pack the photo is a real <img fetchpriority="high"> (the hero is
// the LCP element) with the pack's art slots around it. Legacy themes keep
// the inline background image their CSS was written for.
function PackHeroMedia({ heroPhoto }) {
  const meta = useCopy().invitation?.hero_photo_meta
  return (
    <>
      {heroPhoto && (
        <img className="pk-hero-img pk-photo" srcSet={meta?.srcset} sizes="100vw" src={meta?.fallback || heroPhoto} alt="" fetchpriority="high" decoding="async" width="1080" height="1920" />
      )}
      <ThemeAsset slot="parallax-back" className="pk-parallax pk-parallax-back" />
      <ThemeAsset slot="parallax-mid" className="pk-parallax pk-parallax-mid" />
      <div className="pk-hero-scrim" aria-hidden="true" />
      <ThemeAsset slot="hero-overlay" className="pk-hero-overlay" />
      <ThemeAsset slot="parallax-front" className="pk-parallax pk-parallax-front" />
      <ThemeAsset slot="corner-tl" className="pk-corner pk-corner-tl" />
      <ThemeAsset slot="corner-br" className="pk-corner pk-corner-br" />
    </>
  )
}

// The hero photo inside the pack's photo ring (same frame as the profile photos).
function FramedPortrait({ heroPhoto }) {
  const meta = useCopy().invitation?.hero_photo_meta
  return (
    <div className="pk-photo-frame pk-hero-portrait">
      <img className="profile-photo pk-photo" srcSet={meta?.srcset} sizes="(min-width: 640px) 320px, 60vw" src={meta?.fallback || heroPhoto} alt="" fetchpriority="high" decoding="async" />
      <ThemeAsset slot="photo-ring" className="pk-photo-ring" />
    </div>
  )
}

export default function HeroSection({ brideName, groomName, weddingDate, heroPhoto }) {
  const pack = usePack()
  const formatted = weddingDate
    ? formatDateOnly(weddingDate)
    : ''

  // "hero": "framed" (theme.json): the pack's painting is the hero and the
  // couple's photo sits in its photo ring, above the names. With hero-top /
  // hero-bottom bands (portrait screens), the flowers are pinned to the edges
  // and the section grows to fit, so they never cover the names; hero-bg is
  // the painting for wide screens (or for every screen without bands).
  if (pack?.pack.manifest.hero === 'framed') {
    const bands = Boolean(pack.pack.manifest.slots?.['hero-top'])
    return (
      <section className="hero-section pk-hero pk-hero--framed" data-bands={bands || undefined}>
        <ThemeAsset slot="hero-bg" className="pk-hero-bg" />
        <ThemeAsset slot="hero-top" className="pk-hero-band pk-hero-band--top" />
        <ThemeAsset slot="hero-bottom" className="pk-hero-band pk-hero-band--bottom" />
        <HeroContent brideName={brideName} groomName={groomName} formatted={formatted}
          portrait={heroPhoto && <FramedPortrait heroPhoto={heroPhoto} />} />
      </section>
    )
  }

  if (pack) {
    return (
      <section className={`hero-section pk-hero${heroPhoto ? ' pk-hero--photo' : ''}`}>
        <PackHeroMedia heroPhoto={heroPhoto} />
        <HeroContent brideName={brideName} groomName={groomName} formatted={formatted} />
      </section>
    )
  }

  return (
    <section
      className={`hero-section ${heroPhoto ? 'has-photo' : ''}`}
      style={heroPhoto ? { backgroundImage: `url(${heroPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {heroPhoto && <div className="hero-scrim" aria-hidden="true" />}
      <div className="hero-overlay" aria-hidden="true" />
      <HeroContent brideName={brideName} groomName={groomName} formatted={formatted} />
    </section>
  )
}

function HeroContent({ brideName, groomName, formatted, portrait }) {
  const { t, variant, invitation } = useCopy()
  // The blessing line is the variant's (islam: the Bismillah, verbatim from
  // Tanzil); other variants have none. Its Tanzil credit goes right under it,
  // unless a verse section further down already carries the credit.
  const blessing = blessingFor(variant)
  const creditHere = blessing && !scriptureFor(invitation)
  return (
    <>
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {portrait}
        {blessing && <p className="hero-bismillah" lang="ar" dir="rtl">{blessing.arabic}</p>}
        {creditHere && <QuranCredit t={t} className="hero-quran-credit" />}
        <p className="hero-label">{t('hero.label')}</p>
        <span className="hero-ornament" aria-hidden="true" />
        <motion.h1
          className="hero-names"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="hero-bride">{brideName}</span>
          <span className="hero-ampersand">&amp;</span>
          <span className="hero-groom">{groomName}</span>
        </motion.h1>
        <motion.p
          className="hero-date"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {formatted}
        </motion.p>
      </motion.div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <span />
      </div>
    </>
  )
}
