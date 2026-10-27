import { motion } from 'framer-motion'
import SectionTitle from './SectionTitle.jsx'
import { usePack } from '../../themes/packs/_system/ThemeContext.jsx'
import ThemeAsset from '../../themes/packs/_system/ThemeAsset.jsx'
import Monogram from '../../themes/packs/_system/Monogram.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'
import ResponsiveImg from '../ui/ResponsiveImg.jsx'

// "Bapak Suryadi (Alm.) & Ibu Lestari (Almh.)" from the structured fields,
// else the couple's own free-text line.
function parentsLine(couple, person, t) {
  const father = couple[`${person}_father`]
  const mother = couple[`${person}_mother`]
  if (!father && !mother) return couple[`${person}_parents`]
  const late = (dead, key) => (dead ? ` (${t(key)})` : '')
  return [
    father && `Bapak ${father}${late(couple[`${person}_father_deceased`], 'profile.late')}`,
    mother && `Ibu ${mother}${late(couple[`${person}_mother_deceased`], 'profile.lateFemale')}`,
  ].filter(Boolean).join(' & ')
}

function PersonCard({ couple, person, delay }) {
  const pack = usePack()
  const { t } = useCopy()
  const name = couple[`${person}_name`]
  const photo = couple[`${person}_photo`]
  const bio = couple[`${person}_bio`]
  const instagram = couple[`${person}_instagram`]
  const order = couple[`${person}_child_order`]
  const parents = parentsLine(couple, person, t)
  // Wording follows who the person is, not a "Putri/Putra" compromise.
  const childOf = person === 'bride'
    ? (order ? t('profile.daughterOf', { order }) : t('profile.daughterOfNoOrder'))
    : (order ? t('profile.sonOf', { order }) : t('profile.sonOfNoOrder'))
  const meta = couple[`${person}_photo_meta`]
  const img = photo && <ResponsiveImg src={photo} meta={meta} sizes="(min-width: 640px) 280px, 60vw" alt={name} className="profile-photo" loading="lazy" decoding="async" />
  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
    >
      {/* Packs frame the photo (photo-mask / photo-ring slots); legacy gets the bare <img>. */}
      {photo && (pack ? (
        <div className="pk-photo-frame">
          {img}
          <ThemeAsset slot="photo-ring" className="pk-photo-ring" />
        </div>
      ) : (
        <ResponsiveImg src={photo} meta={meta} sizes="(min-width: 640px) 280px, 60vw" alt={name} className="profile-photo" />
      ))}
      <h3 className="profile-name">{name}</h3>
      {parents && parents !== '-' && <p className="profile-parents">{childOf}<br />{parents}</p>}
      {instagram && (
        <a className="profile-instagram" href={`https://www.instagram.com/${encodeURIComponent(instagram)}/`} target="_blank" rel="noopener noreferrer">
          @{instagram}
        </a>
      )}
      {bio && <p className="profile-bio">{bio}</p>}
    </motion.div>
  )
}

export default function ProfileSection({ couple }) {
  const pack = usePack()
  const { t } = useCopy()
  if (!couple) return null
  return (
    <section className="profile-section">
      <SectionTitle>{t('profile.title')}</SectionTitle>
      <div className="profile-grid">
        <PersonCard couple={couple} person="bride" delay={0} />
        {/* Packs show the monogram; legacy themes get no ornament (was an emoji). */}
        <div className="profile-divider" aria-hidden="true">{pack && <Monogram couple={couple} />}</div>
        <PersonCard couple={couple} person="groom" delay={0.2} />
      </div>
    </section>
  )
}
