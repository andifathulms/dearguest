import { motion } from 'framer-motion'

function PersonCard({ name, parents, photo, bio, delay }) {
  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
    >
      {photo && (
        <img src={photo} alt={name} className="profile-photo" />
      )}
      <h3 className="profile-name">{name}</h3>
      {parents && <p className="profile-parents">Putri/Putra dari<br />{parents}</p>}
      {bio && <p className="profile-bio">{bio}</p>}
    </motion.div>
  )
}

export default function ProfileSection({ couple }) {
  if (!couple) return null
  return (
    <section className="profile-section">
      <h2 className="section-title">Mempelai</h2>
      <div className="profile-grid">
        <PersonCard
          name={couple.bride_name}
          parents={couple.bride_parents}
          photo={couple.bride_photo}
          bio={couple.bride_bio}
          delay={0}
        />
        <div className="profile-divider">🤍</div>
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
