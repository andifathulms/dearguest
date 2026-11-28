import { Fragment, useMemo } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import '../_base/base.css'
import '../_base/variants.css'
import '../_base/filters.css'
import '../_base/openings.css'
import '../_base/motion.css'
import HeroSection from '../../../components/sections/HeroSection.jsx'
import GuestGreeting from '../../../components/ui/GuestGreeting.jsx'
import ScriptureSection from '../../../components/sections/ScriptureSection.jsx'
import { scriptureFor } from '../../../copy/copy.js'
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
import Particles from './Particles.jsx'
import Monogram from './Monogram.jsx'
import SectionEdge from './SectionEdge.jsx'
import SectionProp from './SectionProp.jsx'
import SceneFrame from './SceneFrame.jsx'
import Opening from './openings/Opening.jsx'
import Cover from './layout/Cover.jsx'
import { primaryEvent } from '../../../utils/events.js'

// Every pack renders through this one layout. The sections are the shared
// components (same content for every theme); the pack supplies tokens, art,
// fonts, a layout variant and an opening (docs/theme-packs.md).

function PackSection({ children, tone, edge, prop }) {
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
      {edge && <SectionEdge side={edge} />}{/* after the section, so it stays the wrap's first child */}
      {prop && <SectionProp slot={prop} side={edge === 'left' ? 'right' : 'left'} />}
    </motion.div>
  )
}

export default function PackTheme({ entry, pack, invitation, guestName, preview }) {
  const ctx = useMemo(() => ({ entry, pack, invitation }), [entry, pack, invitation])
  const m = pack.manifest
  const couple = invitation.couple || {}
  const primary = primaryEvent(invitation.events)
  // Section art (prompts/sections): a painted garland replaces the drawn
  // divider, and the card corner reaches the shared cards through a CSS variable.
  const divider = m.slots?.['section-garland'] ? 'section-garland' : 'divider'
  const corner = m.slots?.['card-corner']
  const closingScene = Boolean(m.slots?.['closing-scene'])
  const cornerStyle = corner ? { '--pk-card-corner': `url(${pack.urls[corner.src]})` } : undefined

  const events = invitation.events || []
  const has = list => (list || []).length > 0
  // Sections in order, each with whether it has anything to show. Empty ones
  // are skipped (not rendered as blank wrappers) so alternating tones and
  // dividers fall between real sections only. The third entry names the prop
  // slot (prompts/scenes) that section shows, when the pack has one.
  const sections = [
    [true, <GuestGreeting guestName={guestName} openingText={invitation.opening_text} seat={invitation.seat} />],
    [Boolean(scriptureFor(invitation)), <ScriptureSection />],
    [Boolean(primary?.start), <CountdownTimer targetDate={primary?.start} />],
    [has(events), <EventsSection events={events} dressCode={invitation.dress_code} />, 'prop-1'],
    [has(invitation.stories), <StorySection stories={invitation.stories} />, 'prop-2'],
    [Boolean(invitation.couple), <ProfileSection couple={couple} />],
    [has(invitation.photos), <GallerySection photos={invitation.photos} />],
    [has(invitation.bank_accounts) || Boolean(invitation.wishlist_url || invitation.gift_address?.trim()), <AmplodDigital bankAccounts={invitation.bank_accounts} wishlistUrl={invitation.wishlist_url} />, 'prop-3'],
    [true, <RSVPForm slug={invitation.slug} />, 'prop-4'],
    [true, <WishesWall slug={invitation.slug} />],
    [events.some(e => e.maps_url || e.embed_url), <MapsSection events={events} />],
    [Boolean(invitation.livestream_url), <LiveStreamSection url={invitation.livestream_url} />],
  ].filter(([show]) => show)

  return (
    <MotionConfig reducedMotion="user">
      <PackContext.Provider value={ctx}>
        <div
          className="pk-root"
          data-pack={entry.id}
          data-layout={m.layoutVariant}
          data-gallery={m.gallery || 'grid'}
          data-photo-filter={invitation.photo_filter || 'none'}
          data-signature={(m.motion?.signature || []).join(' ') || undefined}
          data-card-corner={corner ? '' : undefined}
          style={cornerStyle}
        >
          <ThemeAsset slot="texture" className="pk-texture" />
          <Particles />
          {!preview && <Opening Cover={Cover} invitation={invitation} guestName={guestName} />}

          <HeroSection
            brideName={couple.bride_name}
            groomName={couple.groom_name}
            weddingDate={invitation.wedding_date}
            heroPhoto={invitation.hero_photo}
          />

          {sections.map(([, section, prop], i) => (
            <Fragment key={i}>
              {i > 0 && <ThemeAsset slot={divider} className="pk-divider" />}
              <PackSection tone={i % 2 ? 'alt' : 'base'} edge={i % 2 ? 'right' : 'left'} prop={prop}>{section}</PackSection>
            </Fragment>
          ))}

          <WhatsAppShare slug={invitation.slug} brideName={couple.bride_name} groomName={couple.groom_name} />

          {invitation.closing_text && (
            <PackSection>
              {/* A painted closing scene (prompts/scenes) takes the corners' place, with the monogram in its calm centre. */}
              <section className="pk-closing" data-scene={closingScene ? '' : undefined}>
                {!closingScene && <ThemeAsset slot="corner-tl" className="pk-corner pk-corner-tl" />}
                {!closingScene && <ThemeAsset slot="corner-br" className="pk-corner pk-corner-br" />}
                <SceneFrame slot="closing-scene"><Monogram couple={couple} /></SceneFrame>
                <p>{invitation.closing_text}</p>
              </section>
            </PackSection>
          )}

          {invitation.watermark && (
            <div className="watermark-footer">
              Dibuat dengan <a href={watermarkHref(invitation.slug)}>Vowvella</a>
            </div>
          )}

          <MusicPlayer musicUrl={invitation.music_file} />
          <FloatingRSVP />
        </div>
      </PackContext.Provider>
    </MotionConfig>
  )
}

// The free-tier footer link, tagged so the funnel can count invitations that
// bring in new couples. The campaign is a hash of the slug: no names.
function watermarkHref(slug) {
  let h = 0x811c9dc5
  for (const ch of slug || '') h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0
  const campaign = h.toString(16).padStart(8, '0')
  return `/?utm_source=invitation&utm_medium=watermark&utm_campaign=${campaign}`
}
