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
import AmbientLayer from '../../motion/AmbientLayer.jsx'
import { FloralSVG, Rule } from './extras.jsx'

// The 28 classic themes were one template copied 28 times; this is that
// template once. Each theme's look lives entirely in its untouched CSS file
// (loaded by loadLegacyTheme); the registry supplies the root class and the
// few `extras` three themes added on top. The DOM must stay identical to the
// old per-theme components: the legacy pixel-identity proof depends on it.

// Theme stylesheets, one lazy chunk each. Same order as the old per-theme
// imports: the theme's own CSS, then the shared luxe finish layer.
const css = import.meta.glob('../*/*.css')
const loadLuxe = () => import('../_luxe/luxe.css')

export async function loadLegacyTheme(entry) {
  const { dir } = entry.legacy
  await css[`../${dir}/${dir}.css`]()
  await loadLuxe()
}

function Section({ children, rule }) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      {children}
    </motion.div>
  )
  return rule ? <><Rule />{body}</> : body
}

export default function LegacyTheme({ entry, invitation, guestName }) {
  const { rootClass, extras } = entry.legacy
  const has = name => extras.includes(name)
  const rules = has('section-rules')
  const couple = invitation.couple || {}
  const akad = (invitation.events || []).find(e => e.event_type === 'akad')

  const hero = (
    <HeroSection
      brideName={couple.bride_name}
      groomName={couple.groom_name}
      weddingDate={invitation.wedding_date}
      heroPhoto={invitation.hero_photo}
    />
  )

  return (
    <div className={rootClass}>
      {/* Inside the theme root so it lands in the theme's stacking context
          (see `.javanese-dark > .jd-ambient`). */}
      {has('ambient-layer') && <AmbientLayer />}
      {has('kawung-borders') && <div className="kawung-border-top" />}

      {has('floral-corners') ? (
        <div style={{ position: 'relative' }}>
          <div className="floral-corner floral-corner-tl"><FloralSVG /></div>
          <div className="floral-corner floral-corner-br"><FloralSVG /></div>
          {hero}
        </div>
      ) : hero}

      <Section rule={rules}><GuestGreeting guestName={guestName} openingText={invitation.opening_text} /></Section>
      <Section rule={rules}><CountdownTimer targetDate={akad?.datetime} /></Section>
      <Section rule={rules}><EventsSection events={invitation.events} dressCode={invitation.dress_code} /></Section>
      <Section rule={rules}><StorySection stories={invitation.stories} /></Section>
      <Section rule={rules}><ProfileSection couple={couple} /></Section>
      <Section rule={rules}><GallerySection photos={invitation.photos} /></Section>
      <Section rule={rules}><AmplodDigital bankAccounts={invitation.bank_accounts} wishlistUrl={invitation.wishlist_url} /></Section>
      <Section rule={rules}><RSVPForm slug={invitation.slug} /></Section>
      <Section rule={rules}><WishesWall slug={invitation.slug} /></Section>
      <Section rule={rules}><MapsSection events={invitation.events} /></Section>
      <Section rule={rules}><LiveStreamSection url={invitation.livestream_url} /></Section>

      {rules && <Rule />}
      <WhatsAppShare
        slug={invitation.slug}
        brideName={couple.bride_name}
        groomName={couple.groom_name}
      />

      {invitation.closing_text && (
        <motion.section
          className={has('closing-class') ? 'closing-section' : undefined}
          style={{
            textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)',
            fontStyle: 'italic', fontFamily: 'var(--font-serif)',
            ...(rules && { fontWeight: 300 }),
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p>{invitation.closing_text}</p>
        </motion.section>
      )}

      {rules && <Rule />}

      {invitation.watermark && (
        <div className="watermark-footer">
          Dibuat dengan <a href="/">Dear Guest</a>
        </div>
      )}

      {has('kawung-borders') && <div className="kawung-border-bottom" />}
      <MusicPlayer musicUrl={invitation.music_file} />
      <FloatingRSVP />
    </div>
  )
}
