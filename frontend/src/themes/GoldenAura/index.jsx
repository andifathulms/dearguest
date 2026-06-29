import '../DecoNoir/DecoNoir.css'
import '../_cinematic/cinematic.css'
import './GoldenAura.css'
import { lazy, Suspense, useState } from 'react'
import { motion } from 'framer-motion'
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

const GoldenScene = lazy(() => import('./GoldenScene.jsx'))

// Each section rises + fades in on scroll; composes with the section
// components' own item animations (single reveal layer, no class fighting).
function Section({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 64, scale: 0.965 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.16, 0.84, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function GoldenAura({ invitation, guestName }) {
  const couple = invitation.couple || {}
  const akad = (invitation.events || []).find(e => e.event_type === 'akad')
  const [quality, setQuality] = useState('high')

  return (
    <div className={`deco-noir golden-3d cc-root cc-q-${quality}`}>
      <Suspense fallback={null}>
        <GoldenScene quality={quality} onQuality={setQuality} />
      </Suspense>

      <div className="cc-content">
        <HeroSection
          brideName={couple.bride_name}
          groomName={couple.groom_name}
          weddingDate={invitation.wedding_date}
          heroPhoto={invitation.hero_photo}
          theme="golden-3d"
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

        <WhatsAppShare slug={invitation.slug} brideName={couple.bride_name} groomName={couple.groom_name} />

        {invitation.closing_text && (
          <motion.section
            style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            <p>{invitation.closing_text}</p>
          </motion.section>
        )}

        {invitation.watermark && (
          <div className="watermark-footer">Dibuat dengan <a href="/">Dear Guest</a></div>
        )}
      </div>

      <MusicPlayer musicUrl={invitation.music_file} />
      <FloatingRSVP />
    </div>
  )
}
