import './DecoNoir.css'
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

function Section({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      {children}
    </motion.div>
  )
}

export default function DecoNoir({ invitation, guestName }) {
  const couple = invitation.couple || {}
  const akad = (invitation.events || []).find(e => e.event_type === 'akad')

  return (
    <div className="deco-noir">
      <HeroSection
        brideName={couple.bride_name}
        groomName={couple.groom_name}
        weddingDate={invitation.wedding_date}
        heroPhoto={invitation.hero_photo}
        theme="deco-noir"
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

      <MusicPlayer musicUrl={invitation.music_file} />
      <FloatingRSVP />
    </div>
  )
}
