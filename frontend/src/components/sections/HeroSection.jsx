import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { usePack } from '../../themes/packs/_system/ThemeContext.jsx'
import ThemeAsset from '../../themes/packs/_system/ThemeAsset.jsx'

// In a theme pack the photo is a real <img fetchpriority="high"> (the hero is
// the LCP element) with the pack's art slots around it. Legacy themes keep
// the inline background image their CSS was written for.
function PackHeroMedia({ heroPhoto }) {
  return (
    <>
      {heroPhoto && (
        <img className="pk-hero-img pk-photo" src={heroPhoto} alt="" fetchpriority="high" decoding="async" width="1080" height="1920" />
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

export default function HeroSection({ brideName, groomName, weddingDate, heroPhoto }) {
  const pack = usePack()
  const formatted = weddingDate
    ? format(new Date(weddingDate), 'EEEE, d MMMM yyyy', { locale: id })
    : ''

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

function HeroContent({ brideName, groomName, formatted }) {
  return (
    <>
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <p className="hero-bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
        <p className="hero-label">We Are Getting Married</p>
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
