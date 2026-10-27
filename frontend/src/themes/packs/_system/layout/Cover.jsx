import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import ThemeAsset from '../ThemeAsset.jsx'
import Monogram from '../Monogram.jsx'
import { usePack } from '../ThemeContext.jsx'
import { useCopy } from '../../../../copy/CopyContext.jsx'

// A name split into per-letter spans so `css` openings can type it on.
// The visible text stays a single readable string for assistive tech.
function TypedName({ text, offset, step }) {
  return (
    <span className="pk-typed" aria-label={text} style={{ '--char-step': step }}>
      {[...text].map((ch, i) => (
        <span key={i} className="pk-char" aria-hidden="true" style={{ '--i': offset + i }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )
}

// What every cover says, whatever the layout: monogram, names, date, the
// guest's name from ?to= on its own line, and the open button.
function CoverContent({ invitation, guestName, openButton }) {
  const { t } = useCopy()
  const couple = invitation.couple || {}
  const bride = couple.bride_name || ''
  const groom = couple.groom_name || ''
  // Spread the typing over ~55 % of the opening, however long the names are.
  const step = `calc(var(--op-dur) * 0.55 / ${Math.max(bride.length + groom.length + 1, 1)})`
  const date = invitation.wedding_date
    ? format(new Date(invitation.wedding_date), 'EEEE, d MMMM yyyy', { locale: id })
    : ''

  return (
    <div className="pk-cover-content">
      <Monogram couple={couple} className="pk-op-late" />
      <p className="cover-label pk-op-late" style={{ '--late-i': 0 }}>{t('cover.label')}</p>
      <h1 className="cover-names">
        <TypedName text={bride} offset={0} step={step} />
        <span className="cover-amp"><TypedName text="&" offset={bride.length} step={step} /></span>
        <TypedName text={groom} offset={bride.length + 1} step={step} />
      </h1>
      {date && <p className="cover-date pk-op-late" style={{ '--late-i': 1 }}>{date}</p>}
      <div className="cover-guest pk-op-late" style={{ '--late-i': 2 }}>
        <p className="cover-guest-to">{t('cover.to')}</p>
        <p className="cover-guest-name">{guestName || t('cover.guestFallback')}</p>
      </div>
      <div className="pk-op-late" style={{ '--late-i': 3 }}>{openButton}</div>
    </div>
  )
}

// full-bleed: the couple's photo fills the screen; a plate fades away as it resolves.
function FullBleedCover(props) {
  const photo = props.invitation.hero_photo
  return (
    <div className="pk-cover pk-cover--full-bleed">
      <ThemeAsset slot="cover-bg" className="pk-cover-bg" />
      {photo && (
        <img className="pk-cover-photo pk-photo" src={photo} alt="" fetchpriority="high" decoding="async" width="1080" height="1920" />
      )}
      <div className="pk-cover-plate" aria-hidden="true" />
      <div className="pk-cover-scrim" aria-hidden="true" />
      <ThemeAsset slot="corner-tl" className="pk-corner pk-corner-tl" />
      <ThemeAsset slot="corner-br" className="pk-corner pk-corner-br" />
      <CoverContent {...props} />
    </div>
  )
}

// framed-card: a card on the cover background, wearing the pack's frame.
function FramedCardCover(props) {
  return (
    <div className="pk-cover pk-cover--framed-card">
      <ThemeAsset slot="cover-bg" className="pk-cover-bg" />
      <ThemeAsset slot="parallax-back" className="pk-parallax pk-parallax-back" />
      <ThemeAsset slot="parallax-mid" className="pk-parallax pk-parallax-mid" />
      <ThemeAsset slot="corner-tl" className="pk-corner pk-corner-tl" />
      <ThemeAsset slot="corner-br" className="pk-corner pk-corner-br" />
      <div className="pk-cover-card">
        <ThemeAsset slot="cover-frame" className="pk-cover-frame" />
        <CoverContent {...props} />
      </div>
      <ThemeAsset slot="parallax-front" className="pk-parallax pk-parallax-front" />
    </div>
  )
}

// arch: the card is an arched window (gate, mihrab, gebyok).
function ArchCover(props) {
  return (
    <div className="pk-cover pk-cover--arch">
      <ThemeAsset slot="cover-bg" className="pk-cover-bg" />
      <ThemeAsset slot="corner-tl" className="pk-corner pk-corner-tl" />
      <ThemeAsset slot="corner-br" className="pk-corner pk-corner-br" />
      <div className="pk-cover-card pk-cover-arch">
        <ThemeAsset slot="cover-frame" className="pk-cover-frame" />
        <CoverContent {...props} />
      </div>
    </div>
  )
}

const COVERS = { 'full-bleed': FullBleedCover, 'framed-card': FramedCardCover, arch: ArchCover }

export default function Cover(props) {
  const { pack } = usePack()
  const Layout = COVERS[pack.manifest.layoutVariant] || FramedCardCover
  return <Layout {...props} />
}
