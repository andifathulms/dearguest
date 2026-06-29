import '../MidnightCelestial/MidnightCelestial.css'
import './CelestialCinematic.css'
import { lazy, Suspense, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// Selectors for the elements that reveal on scroll.
const REVEAL_SEL = '.section-title,.greeting-text,.countdown-unit,.event-card,.story-content,.profile-card,.gallery-item,.amplod-desc,.bank-card,.rsvp-form,.wish-card,.map-item,.hero-names'

// Reveal each element (rise + fade) as it scrolls into view, staggered within
// its group. IntersectionObserver works in every browser; rescans pick up
// async-loaded content (wishes/gallery). No-op under reduced motion.
function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('cc-in'); io.unobserve(e.target) }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })

    const scan = () => {
      root.querySelectorAll(REVEAL_SEL).forEach((el) => {
        if (el.dataset.ccr) return
        el.dataset.ccr = '1'
        el.classList.add('cc-reveal')
        const sibs = el.parentElement ? Array.from(el.parentElement.children) : []
        const idx = sibs.indexOf(el)
        if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 80}ms`
        io.observe(el)
      })
    }
    scan()
    // Re-scan on any DOM change (async wishes/gallery, or React re-renders from
    // a quality-tier switch) so newly-added/replaced nodes still reveal.
    let raf = 0
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(scan) })
    mo.observe(root, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf) }
  }, [rootRef])
}
import HeroSection from '../../components/sections/HeroSection.jsx'
import GuestGreeting from '../../components/ui/GuestGreeting.jsx'
import CountdownTimer from '../../components/sections/CountdownTimer.jsx'
import EventsSection from '../../components/sections/EventsSection.jsx'
import StorySection from '../../components/sections/StorySection.jsx'
import ProfileSection from '../../components/sections/ProfileSection.jsx'
import GallerySection from '../../components/sections/GallerySection.jsx'
import AmplodDigital from '../../components/sections/AmplodDigital.jsx'
import RSVPForm from '../../components/sections/RSVPForm.jsx'
import WishesWall from '../../components/sections/WishesWall.jsx'
import MapsSection from '../../components/sections/MapsSection.jsx'
import LiveStreamSection from '../../components/sections/LiveStreamSection.jsx'
import MusicPlayer from '../../components/ui/MusicPlayer.jsx'
import FloatingRSVP from '../../components/ui/FloatingRSVP.jsx'
import WhatsAppShare from '../../components/ui/WhatsAppShare.jsx'

// WebGL backdrop is its own lazy chunk so three.js only loads for this theme.
const CelestialScene = lazy(() => import('./CelestialScene.jsx'))

// Plain layout wrapper — the per-element scroll reveal is handled by
// useScrollReveal (IntersectionObserver) so there's a single, reliable system.
function Section({ children }) {
  return <div>{children}</div>
}

export default function CelestialCinematic({ invitation, guestName }) {
  const couple = invitation.couple || {}
  const akad = (invitation.events || []).find(e => e.event_type === 'akad')
  // Adaptive quality: starts highest, the scene drops it only if the device
  // can't sustain the frame-rate. The class gates the expensive CSS blur.
  const [quality, setQuality] = useState('high')
  const contentRef = useRef(null)
  useScrollReveal(contentRef)

  return (
    <div className={`midnight-celestial celestial-cinematic cc-q-${quality}`}>
      <Suspense fallback={null}>
        <CelestialScene quality={quality} onQuality={setQuality} />
      </Suspense>

      <div className="cc-content" ref={contentRef}>
        <HeroSection
          brideName={couple.bride_name}
          groomName={couple.groom_name}
          weddingDate={invitation.wedding_date}
          heroPhoto={invitation.hero_photo}
          theme="celestial-cinematic"
        />

        <Section><GuestGreeting guestName={guestName} openingText={invitation.opening_text} /></Section>
        <Section><CountdownTimer targetDate={akad?.datetime} /></Section>
        <Section><EventsSection events={invitation.events} dressCode={invitation.dress_code} /></Section>
        <Section><StorySection stories={invitation.stories} /></Section>
        <Section><ProfileSection couple={couple} /></Section>
        <Section><GallerySection photos={invitation.photos} /></Section>
        <Section><AmplodDigital bankAccounts={invitation.bank_accounts} wishlistUrl={invitation.wishlist_url} /></Section>
        <Section><RSVPForm slug={invitation.slug} /></Section>
        <Section><WishesWall slug={invitation.slug} /></Section>
        <Section><MapsSection events={invitation.events} /></Section>
        <Section><LiveStreamSection url={invitation.livestream_url} /></Section>

        <WhatsAppShare
          slug={invitation.slug}
          brideName={couple.bride_name}
          groomName={couple.groom_name}
        />

        {invitation.closing_text && (
          <motion.section
            style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p>{invitation.closing_text}</p>
          </motion.section>
        )}

        {invitation.watermark && (
          <div className="watermark-footer">
            Dibuat dengan <a href="/">Dear Guest</a>
          </div>
        )}
      </div>

      <MusicPlayer musicUrl={invitation.music_file} />
      <FloatingRSVP />
    </div>
  )
}
