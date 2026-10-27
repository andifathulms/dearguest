import { motion } from 'framer-motion'
import SectionTitle from './SectionTitle.jsx'
import { usePack } from '../../themes/packs/_system/ThemeContext.jsx'
import ThemeAsset from '../../themes/packs/_system/ThemeAsset.jsx'
import Monogram from '../../themes/packs/_system/Monogram.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'

function PersonCard({ name, parents, photo, bio, delay }) {
  const pack = usePack()
  const img = photo && <img src={photo} alt={name} className="profile-photo" loading="lazy" decoding="async" />
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
        <img src={photo} alt={name} className="profile-photo" />
      ))}
      <h3 className="profile-name">{name}</h3>
      {parents && <p className="profile-parents">Putri/Putra dari<br />{parents}</p>}
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
        <PersonCard
          name={couple.bride_name}
          parents={couple.bride_parents}
          photo={couple.bride_photo}
          bio={couple.bride_bio}
          delay={0}
        />
        <div className="profile-divider">{pack ? <Monogram couple={couple} /> : '🤍'}</div>
        <PersonCard
          name={couple.groom_name}
          parents={couple.groom_parents}
          photo={couple.groom_photo}
          bio={couple.groom_bio}
          delay={0.2}
        />
      </div>
    </section>
  )
}
