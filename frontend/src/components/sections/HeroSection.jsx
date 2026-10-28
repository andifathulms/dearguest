import { useRef } from 'react'
import { motion } from 'framer-motion'
import { formatDateOnly } from '../../utils/dates.js'
import { usePack } from '../../themes/packs/_system/ThemeContext.jsx'
import ThemeAsset from '../../themes/packs/_system/ThemeAsset.jsx'
import { ParallaxLayer, useHeroScroll } from '../../themes/packs/_system/HeroMotion.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'
import { blessingFor, scriptureFor } from '../../copy/copy.js'
import { QuranCredit } from './ScriptureSection.jsx'

// In a theme pack the photo is a real <img fetchpriority="high"> (the hero is
// the LCP element) with the pack's art slots around it; the photo and the
// depth layers move with the hero's scroll (HeroMotion.jsx). Legacy themes keep
// the inline background image their CSS was written for.
function PackHeroMedia({ heroPhoto, m }) {
  const meta = useCopy().invitation?.hero_photo_meta
  return (
    <>
      {heroPhoto && (
        <motion.img className="pk-hero-img pk-photo" style={m.bg} srcSet={meta?.srcset} sizes="100vw" src={meta?.fallback || heroPhoto} alt="" fetchpriority="high" decoding="async" width="1080" height="1920" />
      )}
      <ParallaxLayer slot="parallax-back" motionState={m} />
      <ParallaxLayer slot="parallax-mid" motionState={m} />
      <div className="pk-hero-scrim" aria-hidden="true" />
      <ThemeAsset slot="hero-overlay" className="pk-hero-overlay" />
      <ParallaxLayer slot="parallax-front" motionState={m} />
      <ThemeAsset slot="corner-tl" className="pk-corner pk-corner-tl" />
      <ThemeAsset slot="corner-br" className="pk-corner pk-corner-br" />
    </>
  )
}

// The hero photo inside the pack's photo ring (same frame as the profile photos);
// it tilts back as the hero scrolls away.
function FramedPortrait({ heroPhoto, style }) {
  const meta = useCopy().invitation?.hero_photo_meta
  return (
    <motion.div className="pk-photo-frame pk-hero-portrait" style={style}>
      <img className="profile-photo pk-photo" srcSet={meta?.srcset} sizes="(min-width: 640px) 320px, 60vw" src={meta?.fallback || heroPhoto} alt="" fetchpriority="high" decoding="async" />
      <ThemeAsset slot="photo-ring" className="pk-photo-ring" />
    </motion.div>
  )
}

// The url of a raster slot's main file, as a CSS url() (the shimmer signature masks its sheen with it).
function maskOf(pack, slot) {
  const spec = pack.pack.manifest.slots?.[slot]
  const url = spec && pack.pack.urls[spec.src]
  return url ? `url(${url})` : undefined
}

export default function HeroSection({ brideName, groomName, weddingDate, heroPhoto }) {
  const pack = usePack()
  const ref = useRef(null)
  const m = useHeroScroll(ref)
  const formatted = weddingDate
    ? formatDateOnly(weddingDate)
    : ''

  // "hero": "framed" (theme.json): the pack's painting is the hero and the
  // couple's photo sits in its photo ring, above the names. With hero-top /
  // hero-bottom bands (portrait screens), the flowers are pinned to the edges
  // and the section grows to fit, so they never cover the names; hero-bg is
  // the painting for wide screens (or for every screen without bands). Each
  // layer is a positioned wrapper that moves with the scroll (HeroMotion.jsx).
  if (pack?.pack.manifest.hero === 'framed') {
    const bands = Boolean(pack.pack.manifest.slots?.['hero-top'])
    const masks = { '--pk-band-mask': maskOf(pack, 'hero-top'), '--pk-ring-mask': maskOf(pack, 'photo-ring') }
    return (
      <section ref={ref} className="hero-section pk-hero pk-hero--framed" data-bands={bands || undefined} style={masks}>
        <motion.div className="pk-hero-bg" style={m.bg}><ThemeAsset slot="hero-bg" /></motion.div>
        <ParallaxLayer slot="parallax-back" motionState={m} />
        <ParallaxLayer slot="parallax-mid" motionState={m} />
        {bands && <motion.div className="pk-hero-band pk-hero-band--top" style={m.top}><ThemeAsset slot="hero-top" /></motion.div>}
        {bands && <motion.div className="pk-hero-band pk-hero-band--bottom" style={m.bottom}><ThemeAsset slot="hero-bottom" /></motion.div>}
        <ParallaxLayer slot="parallax-front" motionState={m} />
        <HeroContent brideName={brideName} groomName={groomName} formatted={formatted}
          portrait={heroPhoto && <FramedPortrait heroPhoto={heroPhoto} style={m.portrait} />} />
      </section>
    )
  }

  if (pack) {
    return (
      <section ref={ref} className={`hero-section pk-hero${heroPhoto ? ' pk-hero--photo' : ''}`}>
        <PackHeroMedia heroPhoto={heroPhoto} m={m} />
        <HeroContent brideName={brideName} groomName={groomName} formatted={formatted} />
      </section>
    )
  }

  return (
    <section
      ref={ref}
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
