import { Fragment, useMemo } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import '../_base/base.css'
import '../_base/variants.css'
import '../_base/filters.css'
import '../_base/openings.css'
import HeroSection from '../../../components/sections/HeroSection.jsx'
import GuestGreeting from '../../../components/ui/GuestGreeting.jsx'
import ScriptureSection from '../../../components/sections/ScriptureSection.jsx'
import { blessingFor, scriptureFor } from '../../../copy/copy.js'
import CountdownTimer from '../../../components/sections/CountdownTimer.jsx'
import EventsSection from '../../../components/sections/EventsSection.jsx'
import StorySection from '../../../components/sections/StorySection.jsx'
import ProfileSection from '../../../components/sections/ProfileSection.jsx'
import GallerySection from '../../../components/sections/GallerySection.jsx'
import AmplodDigital from '../../../components/sections/AmplodDigital.jsx'
import RSVPForm from '../../../components/sections/RSVPForm.jsx'
import WishesWall from '../../../components/sections/WishesWall.jsx'
import MapsSection from '../../../components/sections/MapsSection.jsx'
import LiveStreamSection from '../../../components/sections/LiveStreamSection.jsx'
import MusicPlayer from '../../../components/ui/MusicPlayer.jsx'
import FloatingRSVP from '../../../components/ui/FloatingRSVP.jsx'
import WhatsAppShare from '../../../components/ui/WhatsAppShare.jsx'
import { PackContext } from './ThemeContext.jsx'
import ThemeAsset from './ThemeAsset.jsx'
import Monogram from './Monogram.jsx'
import Opening from './openings/Opening.jsx'
import Cover from './layout/Cover.jsx'
import { primaryEvent } from '../../../utils/events.js'

// Every pack renders through this one layout. The sections are the shared
// components (same content for every theme); the pack supplies tokens, art,
// fonts, a layout variant and an opening (docs/theme-packs.md).

function PackSection({ children, tone }) {
  return (
    <motion.div
      className="pk-section-wrap"
      data-tone={tone}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function PackTheme({ entry, pack, invitation, guestName, preview }) {
  const ctx = useMemo(() => ({ entry, pack, invitation }), [entry, pack, invitation])
  const m = pack.manifest
  const couple = invitation.couple || {}
  const primary = primaryEvent(invitation.events)

  const events = invitation.events || []
  const has = list => (list || []).length > 0
  // Sections in order, each with whether it has anything to show. Empty ones
  // are skipped (not rendered as blank wrappers) so alternating tones and
  // dividers fall between real sections only.
  const sections = [
    [true, <GuestGreeting guestName={guestName} openingText={invitation.opening_text} />],
    [Boolean(scriptureFor(invitation) || blessingFor(invitation.copy_variant)), <ScriptureSection />],
    [Boolean(primary?.start), <CountdownTimer targetDate={primary?.start} />],
    [has(events), <EventsSection events={events} dressCode={invitation.dress_code} />],
    [has(invitation.stories), <StorySection stories={invitation.stories} />],
    [Boolean(invitation.couple), <ProfileSection couple={couple} />],
    [has(invitation.photos), <GallerySection photos={invitation.photos} />],
    [has(invitation.bank_accounts) || Boolean(invitation.wishlist_url || invitation.gift_address?.trim()), <AmplodDigital bankAccounts={invitation.bank_accounts} wishlistUrl={invitation.wishlist_url} />],
    [true, <RSVPForm slug={invitation.slug} />],
    [true, <WishesWall slug={invitation.slug} />],
    [events.some(e => e.maps_url || e.embed_url), <MapsSection events={events} />],
    [Boolean(invitation.livestream_url), <LiveStreamSection url={invitation.livestream_url} />],
  ].filter(([show]) => show).map(([, el]) => el)

  return (
    <MotionConfig reducedMotion="user">
      <PackContext.Provider value={ctx}>
        <div
          className="pk-root"
          data-pack={entry.id}
          data-layout={m.layoutVariant}
          data-gallery={m.gallery || 'grid'}
          data-photo-filter={invitation.photo_filter || 'none'}
        >
          <ThemeAsset slot="texture" className="pk-texture" />
          {!preview && <Opening Cover={Cover} invitation={invitation} guestName={guestName} />}

          <HeroSection
            brideName={couple.bride_name}
            groomName={couple.groom_name}
            weddingDate={invitation.wedding_date}
            heroPhoto={invitation.hero_photo}
          />

          {sections.map((section, i) => (
            <Fragment key={i}>
              {i > 0 && <ThemeAsset slot="divider" className="pk-divider" />}
              <PackSection tone={i % 2 ? 'alt' : 'base'}>{section}</PackSection>
            </Fragment>
          ))}

          <WhatsAppShare slug={invitation.slug} brideName={couple.bride_name} groomName={couple.groom_name} />

          {invitation.closing_text && (
            <PackSection>
              <section className="pk-closing">
                <Monogram couple={couple} />
                <p>{invitation.closing_text}</p>
              </section>
            </PackSection>
          )}

          {invitation.watermark && (
            <div className="watermark-footer">
              Dibuat dengan <a href="/">Dear Guest</a>
            </div>
          )}

          <MusicPlayer musicUrl={invitation.music_file} />
          <FloatingRSVP />
        </div>
      </PackContext.Provider>
    </MotionConfig>
  )
}
